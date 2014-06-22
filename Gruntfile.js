module.exports = function(grunt) {

  var config =grunt.file.readJSON('config.json');

  var mail_replacements = Object.keys(config.email)
                        .map(function(key){
                                  return {
                                    from: '%config.email.'+key+'%',
                                    to: config.email[key]
                                  };
                                });
  var sftp_options = {
    path: '/home/pi/.flexget',
    host: config.sftp.host,
    username: config.sftp.username,
    privateKey: grunt.file.read(config.sftp.private_key_path),
    showProgress: true,
    srcBasePath: "build/production/"
  },
  ssh_options = {
    path: '/home/pi/',
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
            to: '127.0.0.1'
          },
          {
            from: '%existing_series_root_folder%',
            to: '/media/5381b885-61ca-44fd-943b-af33cd9e95e2/Video/SerieTv/'
          }
        ].concat(mail_replacements)
      },
      develop : {
        src: ['config.yml'],
        dest: 'build/develop/config.yml',
        replacements: [
          {
            from: '%transmission_host%',
            to: '192.168.1.9'
          },
          {
            from: '%existing_series_root_folder%',
            to: '/home/fabrizio/'
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
        command: '/usr/local/bin/flexget --test execute',
        options: ssh_options
      },
      lint: {
        command: '/usr/local/bin/flexget check',
        options: ssh_options
      },
      deploy : {
        command: 'sudo /etc/init.d/flexget stop && sudo /etc/init.d/flexget start',
        options: ssh_options
      },
      pro_execute :{
        command: '/usr/local/bin/flexget execute',
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
};