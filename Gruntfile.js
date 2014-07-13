module.exports = function(grunt) {

  var path = require('path'),
      util = require('util'),
      config =grunt.file.readJSON('config.json');

  var mail_replacements = Object.keys(config.email)
                        .map(function(key){
                                  return {
                                    from: '%config.email.'+key+'%',
                                    to: config.email[key]
                                  };
                                });
  var complete_config_path = {
    production : path.join( config.flexget.production.config_path, (config.flexget.production.config_file_name || 'config.yml') ),
    development : path.join( config.flexget.development.config_path, (config.flexget.development.config_file_name || 'config.yml') )
  };

  var sftp_options = {
    path: path.normalize(config.flexget.production.config_path),
    host: config.sftp.host,
    username: config.sftp.username,
    privateKey: grunt.file.read(config.sftp.private_key_path),
    showProgress: true,
    srcBasePath: "build/production/"
  },
  ssh_options = {
    path: util.format('/home/%s/',config.flexget.production.user || config.sftp.username),
    host: config.sftp.host,
    username: config.sftp.username,
    privateKey: grunt.file.read(config.sftp.private_key_path)
  };

  // Project configuration.
  grunt.initConfig({

    replace: {
      production: {
        src: ['config.yml'],
        dest: 'build/production/config.yml',
        replacements: [
          {
            from: '%transmission_host%',
            to: config.transmission.production.host
          },
          {
            from: '%existing_series_root_folder%',
            to: config.flexget.production.existing_series_root_folder
          }
        ].concat(mail_replacements)
      },
      develop : {
        src: ['config.yml'],
        dest: 'build/develop/config.yml',
        replacements: [
          {
            from: '%transmission_host%',
            to: config.transmission.development.host
          },
          {
            from: '%existing_series_root_folder%',
            to: config.flexget.development.existing_series_root_folder
          }
        ].concat(mail_replacements)
      }
    },
    sftp: {
      deploy: {
        files: {
          './':"build/production/config.yml"
        },
        options: sftp_options
      }
    },
    sshexec: {
      test: {
        command: util.format('/usr/local/bin/flexget -c %s --test execute', complete_config_path.production),
        options: ssh_options
      },
      lint: {
        command: util.format('/usr/local/bin/flexget -c %s check',complete_config_path.production),
        options: ssh_options
      },
      deploy : {
        command: 'sudo /etc/init.d/flexget stop && sudo /etc/init.d/flexget start',
        options: ssh_options
      },
      pro_execute :{
        command: util.format('/usr/local/bin/flexget -c %s execute',complete_config_path.production),
        options: ssh_options
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-text-replace');
  grunt.loadNpmTasks('grunt-ssh');

  // Default task(s).
  grunt.registerTask('default', ['dev','publish']);
  grunt.registerTask('dev', ['replace']);
  grunt.registerTask('publish', ['sftp']);
  grunt.registerTask('test', ['sshexec:test']);
  grunt.registerTask('lint', ['sshexec:lint']);
  grunt.registerTask('pro_test', ['lint','test']);
  /**
   * Task di produzione. Dalla generazione fino alla pubblicazione e test
   */
  grunt.registerTask('production', ['default','pro_test']);
};