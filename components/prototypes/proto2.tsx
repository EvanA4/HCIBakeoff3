import { computeLevenshteinDistance } from "@/utils/levenshtein";
import { phrases } from "@/utils/phrases";
import p5 from "p5";

export default function Proto2(props: {
    dpi: number
}) {
    const protoFn = (p5: p5) => {
        /* START OF PROTOTYPE CODE */
        


        const DPIofYourDeviceScreen = props.dpi; //you will need to measure or look up the DPI or PPI of your device/browser to make sure you get the right scale!!
        const sizeOfInputArea = DPIofYourDeviceScreen*1; //aka, 1.0 inches square!

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

        // Variables for this prototype
        const letterBank = ["a e i o u y", "b c d f g h j k l m", "n p q r s t v w x z"];
        let page1ButtonPoses: number[][];
        let page2ButtonPoses: number[][];
        let stage = -1; // 0 = page 1, 1 = page 2
        let group = -1; // 1 = vowels, 2 = first half of consonants, 3 = second half of consonants

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

            page1ButtonPoses = [
                [p5.width/2-sizeOfInputArea/2, p5.height/2-sizeOfInputArea/2, sizeOfInputArea, sizeOfInputArea/4],
                [p5.width/2-sizeOfInputArea/2, p5.height/2-sizeOfInputArea/4, sizeOfInputArea, sizeOfInputArea/4],
                [p5.width/2-sizeOfInputArea/2, p5.height/2, sizeOfInputArea, sizeOfInputArea/4],

                [p5.width/2-sizeOfInputArea/2, p5.height/2+sizeOfInputArea/4, sizeOfInputArea/2, sizeOfInputArea/4],
                [p5.width/2, p5.height/2+sizeOfInputArea/4, sizeOfInputArea/2, sizeOfInputArea/4],
            ]

            page2ButtonPoses = [
                [p5.width/2-sizeOfInputArea/2, p5.height/2-sizeOfInputArea/2, sizeOfInputArea/2, sizeOfInputArea/5],
                [p5.width/2, p5.height/2-sizeOfInputArea/2, sizeOfInputArea/2, sizeOfInputArea/5],

                [p5.width/2-sizeOfInputArea/2, p5.height/2-sizeOfInputArea/2+sizeOfInputArea/5, sizeOfInputArea/2, sizeOfInputArea/5],
                [p5.width/2, p5.height/2-sizeOfInputArea/2+sizeOfInputArea/5, sizeOfInputArea/2, sizeOfInputArea/5],

                [p5.width/2-sizeOfInputArea/2, p5.height/2-sizeOfInputArea/2+2*sizeOfInputArea/5, sizeOfInputArea/2, sizeOfInputArea/5],
                [p5.width/2, p5.height/2-sizeOfInputArea/2+2*sizeOfInputArea/5, sizeOfInputArea/2, sizeOfInputArea/5],

                [p5.width/2-sizeOfInputArea/2, p5.height/2-sizeOfInputArea/2+3*sizeOfInputArea/5, sizeOfInputArea/2, sizeOfInputArea/5],
                [p5.width/2, p5.height/2-sizeOfInputArea/2+3*sizeOfInputArea/5, sizeOfInputArea/2, sizeOfInputArea/5],

                [p5.width/2-sizeOfInputArea/2, p5.height/2-sizeOfInputArea/2+4*sizeOfInputArea/5, sizeOfInputArea/2, sizeOfInputArea/5],
                [p5.width/2, p5.height/2-sizeOfInputArea/2+4*sizeOfInputArea/5, sizeOfInputArea/2, sizeOfInputArea/5],
            ]
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
                stage = 0; 
                nextTrial(); //start the trials!
            }

            //if start time does not equal zero, it means we must be in the trials
            if (startTime!=0)
            {
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

                //my draw code
                if (stage == 0) {
                    page1ButtonPoses.forEach((pos, idx) => {
                        switch (idx) {
                            case 3:
                                p5.stroke(0); 
                                p5.strokeWeight(.5);
                                p5.fill(200);
                                p5.rect(pos[0], pos[1], pos[2], pos[3]);

                                p5.strokeWeight(0);
                                p5.textAlign(p5.CENTER, p5.CENTER);
                                p5.fill(0);
                                p5.text('space', pos[0], pos[1], pos[2], pos[3]);
                                break;
                            case 4:
                                p5.stroke(0); 
                                p5.strokeWeight(.5);
                                p5.fill(200, 100, 100);
                                p5.rect(pos[0], pos[1], pos[2], pos[3]);

                                p5.strokeWeight(0);
                                p5.textAlign(p5.CENTER, p5.CENTER);
                                p5.fill(0);
                                p5.text('delete', pos[0], pos[1], pos[2], pos[3]);
                                break;
                            default:
                                const letter = letterBank[idx];
                                p5.stroke(0); 
                                p5.strokeWeight(.5);
                                p5.fill(240);
                                p5.rect(pos[0], pos[1], pos[2], pos[3]);

                                if (letter.length > 0) {
                                    p5.strokeWeight(0);
                                    p5.textAlign(p5.CENTER, p5.CENTER);
                                    p5.fill(0);
                                    p5.text(letter, pos[0], pos[1], pos[2], pos[3]);
                                }
                                break;
                        }
                    });
                    p5.fill(200);
                } else {
                    page2ButtonPoses.forEach((pos, idx)=> {
                        p5.stroke(0); 
                        p5.strokeWeight(.5);
                        p5.fill(240);
                        p5.rect(pos[0], pos[1], pos[2], pos[3]);

                        p5.strokeWeight(0);
                        p5.textAlign(p5.CENTER, p5.CENTER);
                        p5.fill(0);
                        let display = ' ';
                        if (idx < letterBank[group - 1].length/2) {
                            display = letterBank[group - 1][idx * 2];
                        }
                        p5.text(display, pos[0], pos[1], pos[2], pos[3]);
                    });
                }
            }
        }

        function didMouseClick(x: number, y: number, w: number, h: number) //simple function to do hit testing
        {
            return (p5.mouseX > x && p5.mouseX<x+w && p5.mouseY>y && p5.mouseY<y+h); //check to see if it is in button bounds
        }


        //you can replace all of this logic.
        p5.mousePressed = () => {
            if (stage == 0 && startTime != 0 && finishTime == 0) {
                page1ButtonPoses.forEach((pos, idx) => {
                    if (didMouseClick(pos[0], pos[1], pos[2], pos[3])) {
                        switch(idx) {
                            case 3: // space
                                currentTyped += ' ';
                                break;
                            case 4: // delete
                                currentTyped = currentTyped === "" ? "" : currentTyped.substring(0, currentTyped.length - 1);
                                break; 
                            default: 
                                stage = 1;
                                group = idx + 1; // 1 = vowels, 2 = first half of consonants, 3 = second half of consonants
                                break;
                        }
                    }
                });

            } else if (stage == 1) {
                page2ButtonPoses.forEach((pos, idx) => {
                    if (didMouseClick(pos[0], pos[1], pos[2], pos[3])) {
                        if (letterBank[group - 1].length/2 > idx) {
                            currentTyped += letterBank[group - 1][idx * 2];
                            stage = 0;
                        } else {
                            console.log("Error: Button index is out of bounds");
                        }
                    }
                });
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