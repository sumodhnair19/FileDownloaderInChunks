'use strict'
import request from 'request';
import { createWriteStream } from 'fs';
import progress from 'request-progress';
import requestOptions from 'request-options';
import inquirer from 'inquirer';

let outputLocation =  './',   //final output location
    outputFileName,
    serverFileURL,
    iterationCount = 0,
    startRange  = 0,
    endRange  = 1048576,  //1 MiB chunk in bytes(decimal),
    fixedRange = 1048576,
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
 * @param startRange and endRange = comprises of start and end range values
 */

let downloadFileInChunks = (startRange, endRange) => {
  console.log(`StartRange is : ${startRange} and EndRange is :  ${endRange}`);
  options.headers = {Range: `bytes=${startRange}-${endRange}`};
  progress(request(requestOptions(options)))
   .on('progress', state => {
     console.log(`time elapsed ${state.time.elapsed}`)
    })
    .on('error', err => {
      console.log(`error found : ${err}`);
    })
    .on('end', () => {
      iterationCount++;
      startRange = endRange + 1 ;
      endRange  += fixedRange;
      console.log(`Chunk Index : ${iterationCount} : downloaded!!`);
      if(iterationCount >= chunksCount ) {
        console.log('File downloaded successfully. ');
        process.exit();
      } else {
        downloadFileInChunks(startRange, endRange);  //repeat the method
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

let updateRangeBasedOnFileSize =  () => {
  let totalFileSize;
  return new Promise((resolve, reject)=> {
    request
   .get(options.url)
   .on('response', response => {
     totalFileSize = response.headers['content-length'];
     if(totalFileSize && totalFileSize < maxSizeAllowed) {
       endRange = fixedRange = totalFileSize/chunksCount;   // fixedRange will now be reduced as per the file size if it is lesser than maxallowedsize
       console.log(`Since total file size is lesser than 4Mib, the endRange is updated to ${fixedRange}`);
     }
     resolve(fixedRange);
   })
   .on('error', err => {
     reject(err);
   })
  })
}

/**
 * @name promptInquirer
 * @type {Method}
 * @description gets the input values from the user
 * @param None
 */

let promptInquirer  =   () => {
  inquirer.prompt(questions).then(answers => {
      serverFileURL = answers['sourceURL'] ? answers['sourceURL'] : '';
      outputFileName = answers['outputFileName'] ? answers['outputFileName']: 'default';
      if(serverFileURL) {
        //Loop to iterate 4 times downloading file in 4 chunks and merging finally
        options.url = serverFileURL;
        updateRangeBasedOnFileSize().then((endRange)=>{
            //request resolved, now proceeding to download
            downloadFileInChunks(startRange, endRange);
        },(err)=>{
            //request failed
            console.log(`server responded with an error ${err}`)
        });

      } else {
        console.log('server URL is mandatory. Hence repeating the process. ');
        promptInquirer();
      }
  })
}

promptInquirer();
