# File Downloader In Chunks

The application helps you in fetching only some part of the file from server in chunks.
For e.g downloads only 4mib of any provided URL and in chunks.

## Table of contents :

- Pre-requisites
- Installing Dependencies
- Start Application
- What it does
- What it doesn't
 


## Pre-requisites :

  - Make sure node js is installed in your system.


## Installing Dependencies :-

  - npm install  
  
## Start Application:-
  
  - npm start
    
    
## What it does :-
   
  - Let's you specify Source URL with a required command-line option 
  - File is downloaded in 4 chunks (4 requests made to the server)
  - Only the first 4 MiB of the file is downloaded from the server
  - Let's you specify Output file name with a command-line option ( a default name if not set)
  - Support files smaller than 4 MiB (less chunks/adjust chunk size)
 

## What it doesn't

 - Configurable number of chunks/chunk size/total download size

  
 
 




 
