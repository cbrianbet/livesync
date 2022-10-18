#live sync

Livesync application

---
## Requirements

For development, you will only need Node.js and a node global package, npm installed in your environment, SQL Server and Rabbitmq. 

### Node
- #### Node installation on Windows

  Just go on [official Node.js website](https://nodejs.org/) and download the installer.
Also, be sure to have `git` available in your PATH, `npm` might need it (You can find git [here](https://git-scm.com/)).

- #### Node installation on Ubuntu

  You can install nodejs and npm easily with apt install, just run the following commands.

      $ sudo apt install nodejs
      $ sudo apt install npm

- #### Other Operating Systems
  You can find more information about the installation on the [official Node.js website](https://nodejs.org/) and the [official NPM website](https://npmjs.org/).

If the installation was successful, you should be able to run the following command.

    $ node --version
    v8.11.3

    $ npm --version
    6.1.0

If you need to update `npm`, you can make it using `npm`! Cool right? After running the following command, just open again the command line and be happy.

    $ npm install npm -g

###

---


## First Time Install
Create a folk of the repository from https://github.com/palladiumkenya/livesync.git and clone the repo from your fork.

    $ git clone https://github.com/{{username}}/livesync.git
    $ cd livesync
    
    $ npm install

## Configure app

edit the `development.env` file with your credentials.


## Running the project

    $ npm start

---

## Updating changes on the server
Create a pull request to the master branch of palladiumkenya repository on git.
After successful merge rdp to the server and open I:\ProgramData\npm
Open a terminal window from this location and stop pm2 by running 
    $ .\pm2 stop 0

From the server Locate the livesync code from the Apps Disk.
open the livesync folder and run

    $ git pull https://github.com/palladiumkenya/livesync.git
    $ npm install
    $ npm run build

Finally Start pm2 from the previous terminal window
    $ .\pm2 start 0

Check the logs for any errors
    $ .\pm2 log 0
