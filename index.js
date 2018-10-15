'use strict'
import http from 'http';
import request from 'request';
import fs,{ createWriteStream } from 'fs';
import progress from 'request-progress';
import requestOptions from 'request-options';
import inquirer from 'inquirer';

let outputLocation =  './file',   //final output location
    outputFileName,
    serverFileURL,
    iterationCount,
    startRange  = 0,
    endRange  = 1048576,  //1 MiB chunk in bytes(decimal)
    chunksCount = 4,  // file to be divided in these many chunks
    maxSizeAllowed  = 1048576 * chunksCount, //4MiB in bytes(decimal)
    options = {
                method: 'get',
                headers: {Range: `bytes=${startRange}-${endRange}`},
                url: serverFileURL
              };


/**
 * @name downloadFileInChunks
 * @type {Method}
 * @description gets the file in chunks from the server
 * @param Range which is a rest operator which takes multiple values from parent method and converts it into array
 */

let downloadFileInChunks = (...Range) => {
  options.headers = {Range: `bytes=${Range[0]}-${Range[1]}`};
  progress(request(requestOptions(options)))
   .on('progress', state => {
     console.log(`time elapsed ${state.time.elapsed}`)
    })
    .on('error', err => {
      console.log(`error found : ${err}`);
    })
    .on('end', () => {
      iterationCount++;
      Range.startRange = Range.endRange + 1 ;
      Range.endRange += Range.endRange;

      console.log(`Chunk Index : ${iterationCount} : downloaded!!`);
      if(iterationCount === chunksCount ) {
        console.log('File downloaded successfully. ');
        process.exit();
      }
    })
    .pipe(createWriteStream(`${outputLocation}/${outputFileName}`,{flags: 'a'}) );
}


/**
 * @name questions
 * @type {Array}
 * @description contains questions which will be asked to the user
 */

let questions = [{
  type: 'input',
  name: 'sourceURL',
  message: "Please specify the sourceURL?",
},{
  type: 'input',
  name: 'outputFileName',
  message: "Please specify the output filename?",
}]



/**
 * @name updateRangeBasedOnFileSize
 * @type {Method}
 * @description additional feature, this method tests the file size and if it is lower than 4Mb, it will update ranges accordingly
 * @param Null
 */

let updateRangeBasedOnFileSize = () => {
  let totalFileSize;
  request
  .get(options.url)
  .on('response', response => {
    totalFileSize = response.headers['content-length'];
    if(totalFileSize && totalFileSize < maxSizeAllowed) {
      endRange = totalFileSize/chunksCount;   // endRange will now be reduced as per the file size if it is lesser than maxallowedsize
    }
  })
  .on('error', err => {
    console.log(`error found : ${err}`);
  })
}

/**
 * @name promptInquirer
 * @type {Method}
 * @description gets the input values from the user
 * @param None
 */

let promptInquirer  = () => {
  inquirer.prompt(questions).then(answers => {
      serverFileURL = answers['sourceURL'] ? answers['sourceURL'] : '';
      outputFileName = answers['outputFileName'] ? answers['outputFileName']: 'default';
      if(serverFileURL) {
        //Loop to iterate 4 times downloading file in 4 chunks and merging finally
        iterationCount = 0;
        options.url = serverFileURL;
        updateRangeBasedOnFileSize();   //check file size and update range
        for(let count = 0; count < chunksCount; count++) {
          downloadFileInChunks(startRange, endRange);
        }

      } else {
        console.log('server URL is mandatory. Hence repeating the process. ');
        promptInquirer();
      }
  })
}

promptInquirer();
