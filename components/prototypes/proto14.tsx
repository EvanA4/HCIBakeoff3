import { computeLevenshteinDistance } from "@/utils/levenshtein";
import { phrases } from "@/utils/phrases";
import p5 from "p5";

export default function Proto14(props: {
    dpi: number
}) {
    const protoFn = (p5: p5) => {
        /* START OF PROTOTYPE CODE */
        
        
        
        // HYPERPARAMETERS
        const keyboardArrs = [
            'qwertyuiop'.split(""),
            'asdfghjkl'.split(""),
            'zxcvbnm'.split("")
        ]
        const keyWidthCoef = .7;
        
        const DPIofYourDeviceScreen = props.dpi; //you will need to measure or look up the DPI or PPI of your device/browser to make sure you get the right scale!!
        const sizeOfInputArea = DPIofYourDeviceScreen*1; //aka, 1.0 inches square!
        
        const whiteoutBuf = 10;
        let maxPageNum = 0;
        while (.75*sizeOfInputArea*maxPageNum + sizeOfInputArea/4 - 10*sizeOfInputArea/4*keyWidthCoef < 0) {
            ++maxPageNum;
        }
        let pageNum = Math.floor(maxPageNum/2)-1;

        const totalTrialNum = 2; //the total number of phrases to be tested - set this low for testing. Might be ~10 for the real bakeoff!
        let currTrialNum = 0; // the current trial number (indexes into trials array above)
        let startTime = 0; // time starts when the first letter is entered
        let finishTime = 0; // records the time of when the final trial ends
        let lastTime = 0; //the timestamp of when the last trial was completed
        let lettersEnteredTotal = 0; //a running total of the number of letters the user has entered (need this for final WPM computation)
        let lettersExpectedTotal = 0; //a running total of the number of letters expected (correct phrases)
        let errorsTotal = 0; //a running total of the number of errors (when hitting next)
        let currentPhrase = ""; //the current target phrase
        let currentTyped = ""; //what the user has typed so far

        //Variables for my silly implementation. You can delete this:
        // let currentLetter = 'a'.charCodeAt(0);

        //You can add stuff in here. This is just a basic implementation.
        p5.setup = () => {
            p5.createCanvas(window.innerWidth, window.innerHeight); //Sets the size of the app. You should modify this to your device's native size. Many phones today are 1080 wide by 1920 tall.
            p5.noStroke(); //my code doesn't use any strokes.

            //randomize the phrase order
            for (let i=0; i<phrases.length; i++)
            {
                const r = Math.floor(Math.random()*phrases.length);
                const temp = phrases[i];
                phrases[i] = phrases[r];
                phrases[r] = temp;
            }
        }

        //You can modify stuff in here. This is just a basic implementation.
        p5.draw = () => {
            p5.background(255); //clear background

            //check to see if the user finished. You can't change the score computation.
            if (finishTime!=0)
            {
                p5.fill(0);
                p5.textAlign(p5.CENTER);
                p5.text("Trials complete!",window.innerWidth/2,200); //output
                p5.text("Total time taken: " + (finishTime - startTime),window.innerWidth/2,220); //output
                p5.text("Total letters entered: " + lettersEnteredTotal,window.innerWidth/2,240); //output
                p5.text("Total letters expected: " + lettersExpectedTotal,window.innerWidth/2,260); //output
                p5.text("Total errors entered: " + errorsTotal,window.innerWidth/2,280); //output
                const wpm = (lettersEnteredTotal/5.0) / ((finishTime - startTime)/60000.); //FYI - 60K is number of milliseconds in minute
                p5.text("Raw WPM: " + wpm,window.innerWidth/2,300); //output
                const freebieErrors = lettersExpectedTotal*.05; //no penalty if errors are under 5% of chars
                p5.text("Freebie errors: " + p5.nf(freebieErrors,1,3),window.innerWidth/2,320); //output
                const penalty = p5.max(errorsTotal-freebieErrors, 0) * .5;
                p5.text("Penalty: " + penalty,window.innerWidth/2,340);
                p5.text("WPM w/ penalty: " + (wpm-penalty),window.innerWidth/2,360); //yes, minus, because higher WPM is better

                return;
            }


            //draw 1" watch area
            p5.fill(100);
            p5.rect(p5.width/2-sizeOfInputArea/2, p5.height/2-sizeOfInputArea/2, sizeOfInputArea, sizeOfInputArea); //input area should be 1" by 1"

            //check to see if the user hasn't started yet
            if (startTime==0 && !p5.mouseIsPressed)
            {
                p5.fill(128);
                p5.textAlign(p5.CENTER);
                p5.text("Click to start time!", 280, 150); //display this message until the user clicks!
            }

            if (startTime==0 && p5.mouseIsPressed)
            {
                nextTrial(); //start the trials!
            }

            //if start time does not equal zero, it means we must be in the trials
            if (startTime!=0)
            {
                //my draw code that you should replace.
                // p5.rect(p5.width/2-sizeOfInputArea/2, p5.height/2-sizeOfInputArea/2+sizeOfInputArea/2, sizeOfInputArea/2, sizeOfInputArea/2); //draw left red button
                p5.textAlign(p5.CENTER, p5.CENTER);
                keyboardArrs.forEach((row, rowNum) => {
                    row.forEach((letter, letterNum) => {
                        p5.stroke(0);
                        p5.strokeWeight(1);
                        const keypos = {
                            x: p5.width/2+(letterNum-(row.length/2))*sizeOfInputArea/4*keyWidthCoef + (5*sizeOfInputArea/4*keyWidthCoef - sizeOfInputArea/2) + (.75*sizeOfInputArea*maxPageNum + sizeOfInputArea/4 - 10*sizeOfInputArea/4*keyWidthCoef)/2,
                            y: p5.height/2-sizeOfInputArea/2+rowNum*sizeOfInputArea/4,
                            w: sizeOfInputArea/4 * keyWidthCoef,
                            h: sizeOfInputArea/4
                        }
                        const dragOffset = [
                            pageNum * -sizeOfInputArea * .75,
                            0 // p5.mouseY - mouseDragStartPos[1] + mousePrevOffset[1] // there should be no Y offset
                        ];
                        const doHighlight = p5.mouseIsPressed && didMouseClick(keypos.x + dragOffset[0],keypos.y + dragOffset[1],keypos.w,keypos.h);
                        if (doHighlight) {
                            p5.fill(0, 150, 255);
                        } else {
                            p5.fill(255);
                        }
                        p5.rect(keypos.x + dragOffset[0],keypos.y + dragOffset[1],keypos.w,keypos.h);
                        p5.fill(doHighlight ? 255 : 0);
                        p5.strokeWeight(0);
                        p5.text(letter, keypos.x + keypos.w/2 + dragOffset[0], keypos.y + keypos.h/2 + dragOffset[1]);
                    });
                });

                p5.strokeWeight(1);
                const metaBtns = ['<', '_', '`', '>'];
                for (let i = 0; i < metaBtns.length; ++i) {
                    const keypos = [
                        p5.width/2+((i-2) * sizeOfInputArea/4), p5.height/2+sizeOfInputArea/4, sizeOfInputArea/4, sizeOfInputArea/4
                    ];
                    if (p5.mouseIsPressed && didMouseClick(keypos[0], keypos[1], keypos[2], keypos[3])) {
                        p5.fill(0, 125, 205)
                    } else {
                        if (metaBtns[i] === '<' || metaBtns[i] === '>') {
                            p5.fill(205);
                        } else if (metaBtns[i] === '_') {
                            p5.fill(235);
                        } else {
                            p5.fill(255, 200, 200);
                        }
                    }
                    p5.rect(keypos[0], keypos[1], keypos[2], keypos[3]);
                    p5.text(metaBtns[i], keypos[0] + keypos[2]/2, keypos[1] + keypos[3]/2);
                }
                p5.strokeWeight(0);

                // p5.fill(200);
                // p5.text(String.fromCharCode(currentLetter), p5.width/2-sizeOfInputArea/2+sizeOfInputArea/2, p5.height/2-sizeOfInputArea/2+sizeOfInputArea/2); //draw current letter
                
                //undetectable white canvas
                p5.fill(255);
                p5.rect(0, 0, p5.width, p5.height/2-sizeOfInputArea/2);
                p5.rect(0, p5.height/2+sizeOfInputArea/2, p5.width, p5.height/2-sizeOfInputArea/2);
                p5.rect(0, p5.height/2-sizeOfInputArea/2-whiteoutBuf/2, p5.width/2-sizeOfInputArea/2, sizeOfInputArea + whiteoutBuf);
                p5.rect(p5.width/2+sizeOfInputArea/2, p5.height/2-sizeOfInputArea/2-whiteoutBuf/2, p5.width/2-sizeOfInputArea/2, sizeOfInputArea + whiteoutBuf);

                //you can very slightly adjust the position of the target/entered phrases and next button
                p5.textAlign(p5.LEFT); //align the text left
                p5.fill(128);
                p5.text("Phrase " + (currTrialNum+1) + " of " + totalTrialNum, 70, 50); //draw the trial count
                p5.fill(128);
                p5.text("Target:   " + currentPhrase, 70, 100); //draw the target string
                p5.text("Entered:  " + currentTyped + "|", 70, 140); //draw what the user has entered thus far 

                //draw very basic next button
                p5.fill(255, 0, 0);
                p5.rect(window.innerWidth - 200, window.innerHeight - 200, 200, 200); //draw next button
                p5.fill(255);
                p5.text("NEXT > ", window.innerWidth - 150, window.innerHeight - 150); //draw next label
            }
        }

        function didMouseClick(x: number, y: number, w: number, h: number) //simple function to do hit testing
        {
            return (p5.mouseX > x && p5.mouseX<x+w && p5.mouseY>y && p5.mouseY<y+h); //check to see if it is in button bounds
        }

        function isInBounds() {
            return didMouseClick(
                p5.width/2-sizeOfInputArea/2,
                p5.height/2-sizeOfInputArea/2,
                sizeOfInputArea,
                sizeOfInputArea*.75
            );
        }

        //you can replace all of this logic.
        p5.mousePressed = () => {
            if (isInBounds()) {
                let charToAdd = '';
                for (let rowNum = 0; rowNum < keyboardArrs.length && charToAdd === ''; ++rowNum) {
                    const row = keyboardArrs[rowNum];
                    for (let letterNum = 0; letterNum < row.length && charToAdd === ''; ++letterNum) {
                        const letter = row[letterNum];
                        const keypos = {
                            x: p5.width/2+(letterNum-(row.length/2))*sizeOfInputArea/4*keyWidthCoef + (5*sizeOfInputArea/4*keyWidthCoef - sizeOfInputArea/2),
                            y: p5.height/2-sizeOfInputArea/2+rowNum*sizeOfInputArea/4,
                            w: sizeOfInputArea/4 * keyWidthCoef,
                            h: sizeOfInputArea/4
                        }
                        const dragOffset = [
                            pageNum * -sizeOfInputArea * .75,
                            0 // p5.mouseY - mouseDragStartPos[1] + mousePrevOffset[1] // there should be no Y offset
                        ];
                        if (didMouseClick(keypos.x + dragOffset[0],keypos.y + dragOffset[1],keypos.w,keypos.h)) {
                            charToAdd = letter;
                        }
                    }
                }
                currentTyped += charToAdd;
            }

            if (didMouseClick(p5.width/2-sizeOfInputArea/2, p5.height/2+sizeOfInputArea/4, sizeOfInputArea/4, sizeOfInputArea/4)) {
                pageNum = (pageNum - 1 + maxPageNum) % maxPageNum;
            }
            if (didMouseClick(p5.width/2-sizeOfInputArea/4, p5.height/2+sizeOfInputArea/4, sizeOfInputArea/4, sizeOfInputArea/4)) {
                currentTyped += ' ';
            }
            if (didMouseClick(p5.width/2, p5.height/2+sizeOfInputArea/4, sizeOfInputArea/4, sizeOfInputArea/4)) {
                currentTyped = currentTyped.substring(0, currentTyped.length - 1);
            }
            if (didMouseClick(p5.width/2+sizeOfInputArea/4, p5.height/2+sizeOfInputArea/4, sizeOfInputArea/4, sizeOfInputArea/4)) {
                pageNum = (pageNum + 1) % maxPageNum;
            }

            //You are allowed to have a next button outside the 1" area
            if (didMouseClick(window.innerWidth - 200, window.innerHeight - 200, 200, 200)) //check if click is in next button
            {
                nextTrial(); //if so, advance to next trial
            }
        }


        function nextTrial() {
            if (currTrialNum >= totalTrialNum) //check to see if experiment is done
                return; //if so, just return

            if (startTime!=0 && finishTime==0) //in the middle of trials
            {
                console.log("==================");
                console.log("Phrase " + (currTrialNum+1) + " of " + totalTrialNum); //output
                console.log("Target phrase: " + currentPhrase); //output
                console.log("Phrase length: " + currentPhrase.length); //output
                console.log("User typed: " + currentTyped); //output
                console.log("User typed length: " + currentTyped.length); //output
                console.log("Number of errors: " + computeLevenshteinDistance(currentTyped.trim(), currentPhrase.trim())); //trim whitespace and compute errors
                console.log("Time taken on this trial: " + (p5.millis()-lastTime)); //output
                console.log("Time taken since beginning: " + (p5.millis()-startTime)); //output
                console.log("==================");
                lettersExpectedTotal+=currentPhrase.length;
                lettersEnteredTotal+=currentTyped.length;
                errorsTotal+=computeLevenshteinDistance(currentTyped.trim(), currentPhrase.trim());
            }

            //probably shouldn't need to modify any of this output / penalty code.
            if (currTrialNum == totalTrialNum-1) //check to see if experiment just finished
            {
                finishTime = p5.millis();
                console.log("==================");
                console.log("Trials complete!"); //output
                console.log("Total time taken: " + (finishTime - startTime)); //output
                console.log("Total letters entered: " + lettersEnteredTotal); //output
                console.log("Total letters expected: " + lettersExpectedTotal); //output
                console.log("Total errors entered: " + errorsTotal); //output
                const wpm = (lettersEnteredTotal/5.0) / ((finishTime - startTime)/60000); //FYI - 60K is number of milliseconds in minute
                console.log("Raw WPM: " + wpm); //output
                const freebieErrors = lettersExpectedTotal*.05; //no penalty if errors are under 5% of chars
                console.log("Freebie errors: " + p5.nf(freebieErrors,1,3)); //output
                const penalty = p5.max(errorsTotal-freebieErrors, 0) * .5;
                console.log("Penalty: " + penalty,0,3);
                console.log("WPM w/ penalty: " + (wpm-penalty)); //yes, minus, becuase higher WPM is better
                console.log("==================");
                currTrialNum++; //increment by one so this message only appears once when all trials are done
                return;
            }

            if (startTime==0) //first trial starting now
            {
                console.log("Trials beginning! Starting timer..."); //output we're done
                startTime = p5.millis(); //start the timer!
            } 
            else
            {
                currTrialNum++; //increment trial number
            }

            lastTime = p5.millis(); //record the time of when this trial ended
            currentTyped = ""; //clear what is currently typed preparing for next trial
            currentPhrase = phrases[currTrialNum]; // load the next phrase!
            //currentPhrase = "abc"; // uncomment this to override the test phrase (useful for debugging)
        }



        /* END OF PROTOTYPE CODE */
    }

    new p5(protoFn);
    return (<></>);
}