# TvSeries

My personal flexget generator, tester and publisher.
Provides grunt tasks to manage publishing on a remote host on which runs flexget. 
This tasks is not suitable for all configurations and environments because it's modeled on my needs. You can freely modify it based on yours.

In my configuration I have a develop environment and a production environment, each with its configuration but with the same flexget behaviour.

### Prepare it
Copy `config.example.json` as `config.json` and fill it with your configuration values

### Available tasks

- `dev` : Replace configuration value and produce two configuration in build folder
- `publish`: Publish production configuration on pro environment (using sftp)
- `lint`: Check your configuration on production environment (flexget check)
- `test`: Test you configuration on production environment (flexget execute)
- `pro_test`: Shorthand for `lint` and `test`
- `production`: Execute all previous tasks `dev` `publish` `lint` `test`
