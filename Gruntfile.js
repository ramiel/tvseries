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
  var trasmission_replacements = function(env){
    return Object.keys(config.transmission[env])
                        .map(function(key){
                                  return {
                                    from: '%transmission_'+key+'%',
                                    to: config.transmission[env][key]
                                  };
                                });
  };
  var complete_config_path = {
    production : path.join( config.flexget.production.config_path, (config.flexget.production.config_file_name || 'config.yml') ), 
    development : path.join( (config.flexget.development.config_path || __dirname() + '/build/development/'), (config.flexget.development.config_file_name || 'config.yml') )
  };

  var sftp_options = {
    path: path.normalize(config.flexget.production.config_path),
    host: config.sftp.host,
    username: config.sftp.username,
    password : config.sftp.password,
    showProgress: true,
    srcBasePath: "build/production/"
  },
  ssh_options = {
    path: util.format('/home/%s/',config.flexget.production.user || config.sftp.username),
    host: config.sftp.host,
    username: config.sftp.username,
    password : config.sftp.password
  };

  if(config.sftp.private_key_path){
    ssh_options.privateKey = grunt.file.read(config.sftp.private_key_path);
    sftp_options.privateKey = grunt.file.read(config.sftp.private_key_path);
  }

  // Project configuration.
  grunt.initConfig({

    replace: {
      production: {
        src: ['config.yml'],
        dest: 'build/production/config.yml',
        replacements:  [
            {
                from: '%existing_series_root_folder%',
                to: config.flexget.production.existing_series_root_folder
            }
        ].concat(trasmission_replacements('production').concat(mail_replacements))
      },
      develop : {
        src: ['config.yml'],
        dest: 'build/develop/config.yml',
        replacements: [
            {
                from: '%existing_series_root_folder%',
                to: config.flexget.development.existing_series_root_folder
            }
        ].concat(trasmission_replacements('development').concat(mail_replacements))
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
    },
    exec: {
      local_test: {
        cmd: util.format('/usr/local/bin/flexget -c %s --test execute', complete_config_path.development),
      },
      local_lint: {
        command: util.format('/usr/local/bin/flexget -c %s check',complete_config_path.development),
        options: ssh_options
      },
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-text-replace');
  grunt.loadNpmTasks('grunt-ssh');
  grunt.loadNpmTasks('grunt-exec');

  // Default task(s).
  grunt.registerTask('default', ['dev']);
  grunt.registerTask('dev', ['replace']);
  grunt.registerTask('publish', ['dev','sftp']);
  grunt.registerTask('test', ['sshexec:test']);
  grunt.registerTask('local_test', ['dev','exec:local_test']);
  grunt.registerTask('local_lint', ['dev','exec:local_lint']);
  grunt.registerTask('lint', ['sshexec:lint']);
  grunt.registerTask('pro_test', ['publish','lint','test']);
  /**
   * Task di produzione. Dalla generazione fino alla pubblicazione e test
   */
  grunt.registerTask('production', ['default','pro_test']);
};