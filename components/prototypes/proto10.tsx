import { computeLevenshteinDistance } from "@/utils/levenshtein";
import { phrases } from "@/utils/phrases";
import p5 from "p5";

// QWERTY keyboard keys
type Key = {
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
    baseX: number;
    baseY: number;
    baseW: number;
    baseH: number;
    row: number;
    col: number;
    isSpace: boolean;
    isDelete: boolean;
}

export default function Proto10(props: {
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

        let pressStartTime = 0;
        let pressedKey: Key | null = null;
        let longPressFired = false;
        const LONG_PRESS_MS = 300;

        let magnified = false;
        let magnifiedCenter: Key | null = null;

        const keys: Key[] = [];

        let watchX = 0;
        let watchY = 0;
        let keyWidth = 0;
        let keyHeight = 0;

        // build keyboard layout
        function buildKeyboard() {
            keys.length = 0;

            watchX = (p5.width - sizeOfInputArea) / 2;
            watchY = (p5.height - sizeOfInputArea) / 2;
            keyWidth = sizeOfInputArea / 9;
            keyHeight = sizeOfInputArea / 4;

            const row1 = "QWERTYUIO";
            const row2 = "PASDFGHJK";
            const row3 = "LZXCVBNM";

            // Row 1
            for (let i = 0; i < row1.length; i++) {
                const x = watchX + i * keyWidth;
                const y = watchY;
                keys.push({
                    label: row1[i],
                    x,
                    y,
                    w: keyWidth,
                    h: keyHeight,
                    baseX: x,
                    baseY: y,
                    baseW: keyWidth,
                    baseH: keyHeight,
                    row: 0,
                    col: i,
                    isSpace: false,
                    isDelete: false,
                });
            }

            // Row 2
            for (let i = 0; i < row2.length; i++) {
                const x = watchX * 1 + i * keyWidth;
                const y = watchY + keyHeight;
                keys.push({
                    label: row2[i],
                    x,
                    y,
                    w: keyWidth,
                    h: keyHeight,
                    baseX: x,
                    baseY: y,
                    baseW: keyWidth,
                    baseH: keyHeight,
                    row: 1,
                    col: i,
                    isSpace: false,
                    isDelete: false,
                });
            }

            // Row 3
            for (let i = 0; i < row3.length; i++) {
                const x = watchX * 1 + i * keyWidth;
                const y = watchY + 2 * keyHeight;
                keys.push({
                    label: row3[i],
                    x,
                    y,
                    w: keyWidth,
                    h: keyHeight,
                    baseX: x,
                    baseY: y,
                    baseW: keyWidth,
                    baseH: keyHeight,
                    row: 2,
                    col: i,
                    isSpace: false,
                    isDelete: false,
                });
            }

            // Row 4
            const y4 = watchY + 3 * keyHeight;

            // Space
            const spaceW = keyWidth * 6;
            const spaceX = watchX + (sizeOfInputArea - spaceW) / 2;
            keys.push({
                label: "_",
                x: spaceX,
                y: y4,
                w: spaceW,
                h: keyHeight,
                baseX: spaceX,
                baseY: y4,
                baseW: spaceW,
                baseH: keyHeight,
                row: 3,
                col: 0,
                isSpace: true,
                isDelete: false,
            });

            // Delete
            const backW = keyWidth * 2;
            const backX = watchX + sizeOfInputArea - backW;
            keys.push({
                label: "`",
                x: backX,
                y: y4,
                w: backW,
                h: keyHeight,
                baseX: backX,
                baseY: y4,
                baseW: backW,
                baseH: keyHeight,
                row: 3,
                col: 1,
                isSpace: false,
                isDelete: true,
            });
        }

        function hitRectangle(px: number, py: number, x: number, y: number, w: number, h:number) {
            return (px > x && px < x + w && py > y && py < y + h);
        }

        function isNeighbor(center: Key, k: Key) {
            const dr = Math.abs(center.row - k.row);
            const dc = Math.abs(center.col - k.col);
            return dr <= 1 && dc <= 1;
        }

        function getKeyRectangle(k: Key, clusterRects?: Map<Key, Rectangle>) {
            if (magnified && clusterRects && clusterRects.has(k)) {
                return clusterRects.get(k)!;
            }

            return { x: k.baseX, y: k.baseY, w: k.baseW, h: k.baseH };
        }

        function hitKeyAt(px: number, py: number): Key | null {
            const center = magnified && magnifiedCenter ? magnifiedCenter : null;
            const clusterRects = center ? buildClusterRects(center) : undefined;

            if (magnified && clusterRects) {
                for (const k of keys) {
                    if (!clusterRects.has(k)) continue;
                    const r = clusterRects.get(k)!;
                    if (px > r.x && px < r.x + r.w && py > r.y && py < r.y + r.h) {
                        return k; 
                    }
                }
            }

            for (const k of keys) {
                const r = { x: k.baseX, y: k.baseY, w: k.baseW, h: k.baseH };
                if (px > r.x && px < r.x + r.w && py > r.y && py < r.y + r.h) {
                    return k;
                }
            }

            return null;
        }

        function drawKeyboard() {
            p5.textAlign(p5.CENTER, p5.CENTER);

            const ctx = p5.drawingContext as CanvasRenderingContext2D;
            ctx.save();
            ctx.beginPath();
            ctx.rect(watchX, watchY, sizeOfInputArea, sizeOfInputArea);
            ctx.clip();

            const center = magnified && magnifiedCenter ? magnifiedCenter : null;
            const clusterRects = center ? buildClusterRects(center) : undefined;

            for (const k of keys) {
                if (!k) continue;
                const label = k.label ?? "";
                const r = getKeyRectangle(k, undefined);

                if (k.isDelete) {
                    p5.fill(200, 100, 100);
                } else if (k.isSpace) {
                    p5.fill(200);
                } else {
                    p5.fill(240);
                }
                p5.rect(r.x, r.y, r.w, r.h);
                p5.fill(0);
                p5.text(label.toString(), r.x + r.w / 2, r.y + r.h / 2);
            }

            if (center && clusterRects) {
                for (const k of keys) {
                    if (!clusterRects.has(k)) continue;

                    const label = k.label ?? "";
                    const r = getKeyRectangle(k, clusterRects);

                    if (k.isDelete) {
                        p5.fill(200, 100, 100);
                    } else if (k.isSpace) {
                        p5.fill(200);
                    } else {
                        p5.fill(240);
                    }
                    p5.rect(r.x, r.y, r.w, r.h);
                    p5.fill(0);
                    p5.text(label.toString(), r.x + r.w / 2, r.y + r.h / 2);
                }
            }

            ctx.restore();
        }

        function commitKeyPress(k: Key) {
            if (k.isSpace) {
                currentTyped += " ";
            } else if (k.isDelete) {
                if (currentTyped.length > 0) {
                    currentTyped = currentTyped.substring(0, currentTyped.length - 1);
                }
            } else {
                currentTyped += k.label.toLowerCase();
            }
        }

        type Rectangle = { x: number; y: number; w: number; h: number };

        function buildClusterRects(center: Key): Map<Key, Rectangle> {
            const rects = new Map<Key, Rectangle>();
            const bigW = sizeOfInputArea / 3.2;
            const bigH = sizeOfInputArea / 3.2;
            const cx = watchX + sizeOfInputArea / 2;
            const cy = watchY + sizeOfInputArea / 2;

            for (const k of keys) {
                if (!isNeighbor(center, k)) continue;

                const dr = Math.max(-1, Math.min(1, k.row - center.row));
                const dc = Math.max(-1, Math.min(1, k.col - center.col));

                const x = cx + dc * bigW - bigW / 2;
                const y = cy + dr * bigH - bigH / 2;

                rects.set(k, { x, y, w: bigW, h: bigH });
            }

            return rects;
        }

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

            buildKeyboard();
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

                if (!magnified && pressedKey && p5.mouseIsPressed && !longPressFired) {
                    const heldFor = p5.millis() - pressStartTime;
                    if (heldFor >= LONG_PRESS_MS) {
                        magnified = true;
                        magnifiedCenter = pressedKey;
                        longPressFired = true;
                    }
                }
                drawKeyboard();
            }
        }

        p5.mousePressed = () => {
            if (startTime != 0 && finishTime == 0) {
                if (magnified) {
                    const k = hitKeyAt(p5.mouseX, p5.mouseY);
                    if (k) {
                        commitKeyPress(k);
                        magnified = false;
                        magnifiedCenter = null;
                        pressedKey = null;
                        longPressFired = false;
                        pressStartTime = 0;
                    }
                    return;
                } else {
                    const k = hitKeyAt(p5.mouseX, p5.mouseY);
                    if (k) {
                        pressedKey = k;
                        pressStartTime = p5.millis();
                        longPressFired = false;
                        return;
                    }
                }
            }

            // NEXT button
            if (hitRectangle(p5.mouseX, p5.mouseY, window.innerWidth - 200, window.innerHeight - 200, 200, 200)) {
                nextTrial();
            }
        };

        p5.mouseReleased = () => {
            if (startTime != 0 && finishTime == 0) {
                if (!magnified && pressedKey && !longPressFired) {
                    commitKeyPress(pressedKey);
                }
            }

            pressedKey = null;
            pressStartTime = 0;
            longPressFired = false;
        };


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