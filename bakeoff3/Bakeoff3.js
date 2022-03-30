// Bakeoff #3 - Escrita em Smartwatches
// IPM 2020-21, Semestre 2
// Entrega: até dia 4 de Junho às 23h59 através do Fenix
// Bake-off: durante os laboratórios da semana de 31 de Maio

// p5.js reference: https://p5js.org/reference/

// Database (CHANGE THESE!)
const GROUP_NUMBER   = 1;      // add your group number here as an integer (e.g., 2, 3)
const BAKE_OFF_DAY   = false;  // set to 'true' before sharing during the simulation and bake-off days

let PPI, PPCM;                 // pixel density (DO NOT CHANGE!)
let second_attempt_button;     // button that starts the second attempt (DO NOT CHANGE!)

// Finger parameters (DO NOT CHANGE!)
let finger_img;                // holds our finger image that simules the 'fat finger' problem
let FINGER_SIZE, FINGER_OFFSET;// finger size and cursor offsett (calculated after entering fullscreen)

// Arm parameters (DO NOT CHANGE!)
let arm_img;                   // holds our arm/watch image
let ARM_LENGTH, ARM_HEIGHT;    // arm size and position (calculated after entering fullscreen)

// Study control parameters (DO NOT CHANGE!)
let draw_finger_arm  = false;  // used to control what to show in draw()
let phrases          = [];     // contains all 501 phrases that can be asked of the user
let current_trial    = 0;      // the current trial out of 2 phrases (indexes into phrases array above)
let attempt          = 0       // the current attempt out of 2 (to account for practice)
let target_phrase    = "";     // the current target phrase
let currently_typed  = "";     // what the user has typed so far
let entered          = new Array(2); // array to store the result of the two trials (i.e., the two phrases entered in one attempt)

let CPS              = 0;      // add the characters per second (CPS) here (once for every attempt)

let dicionario       = [];
let current_word     = "";
let show1            = "the";
let show2            = "is";
let counter          = 0;
let first            = false;

// Metrics
let attempt_start_time, attempt_end_time; // attemps start and end times (includes both trials)
let trial_end_time;            // the timestamp of when the lastest trial was completed
let letters_entered  = 0;      // running number of letters entered (for final WPM computation)
let letters_expected = 0;      // running number of letters expected (from target phrase)
let errors           = 0;      // a running total of the number of errors (when hitting 'ACCEPT')
let database;                  // Firebase DB

// 2D Keyboard UI
let leftArrow, rightArrow;     // holds the left and right UI images for our basic 2D keyboard   
let ARROW_SIZE;                // UI button size
let current_letter = '_';      // current char being displayed on our basic 2D keyboard (starts with 'a')
let arr = ['', '', '', '', '', '', '', '', '', '','Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P', 'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L', '↩️', 'Z', 'X', 'C', 'V', 'B', 'N', 'M', ' ', ' ', ' ',];
let posX = [];
let posY = [];
let index = 0;
let kb;
let FLAG_CLICK = false;




// Runs once before the setup() and loads our data (images, phrases)
function preload()
{    
  // Loads simulation images (arm, finger) -- DO NOT CHANGE!
  arm = loadImage("data/arm_watch.png");
  fingerOcclusion = loadImage("data/finger.png");
    
  // Loads the target phrases (DO NOT CHANGE!)
  phrases = loadStrings("data/phrases.txt");
  dicionario = loadStrings("data/count_1wns.txt");
  // Loads UI elements for our basic keyboard
  leftArrow = loadImage("data/left.png");
  rightArrow = loadImage("data/right.png");
  kb = loadImage("data/keyb.png");
}

// Runs once at the start
function setup()
{
  createCanvas(700, 500);   // window size in px before we go into fullScreen()
  frameRate(60);            // frame rate (DO NOT CHANGE!)
  
  // DO NOT CHANGE THESE!
  shuffle(phrases, true);   // randomize the order of the phrases list (N=501)
  target_phrase = phrases[current_trial];
  
  drawUserIDScreen();       // draws the user input screen (student number and display size)
}

function draw()
{ 
  if(draw_finger_arm)
  {
    background(255);           // clear background
    noCursor();                // hides the cursor to simulate the 'fat finger'
    drawArmAndWatch();         // draws arm and watch background
    writeTargetAndEntered();   // writes the target and entered phrases above the watch
    drawACCEPT();              // draws the 'ACCEPT' button that submits a phrase and completes a trial
    
    // Draws the non-interactive screen area (4x1cm) -- DO NOT CHANGE SIZE!
    noStroke();
    fill(255, 155, 50);
    rect(width/2 - 2.0*PPCM, height/2 - 2.0*PPCM, 4.0*PPCM, 1.0*PPCM);
    auxLetter();

    // Draws the touch input area (4x3cm) -- DO NOT CHANGE SIZE!
    stroke(0, 255, 0);
    noFill();
    rect(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM, 4.0*PPCM, 3.0*PPCM);
    draw2Dkeyboard();       // draws our basic 2D keyboard UI
    getLetter();
    drawFatFinger();        // draws the finger that simulates the 'fat finger' problem
  }
}

function auxLetter() {
  if(FLAG_CLICK) {
    noStroke();
    fill(255, 155, 50);
    rect(width/2 - 2.0*PPCM, height/2 - 2.0*PPCM, 4.0*PPCM, 1.0*PPCM);
    textAlign(CENTER); 
    textFont("Arial", 24);
    fill(0);
    text(current_letter, width/2, height/2 - 1.5 * PPCM);
    first = true;
  }
  else {
    if (first == true){
       textAlign(CENTER); 
        textFont("Arial", 24);
        fill(0);
        text('_', width/2, height/2 - 1.5 * PPCM);
    }
    else{
      textAlign(CENTER); 
        textFont("Arial", 18);
        fill(0);
        text('"HOLD AND DRAG"', width/2, height/2 - 1.5 * PPCM);
    }
    
  }
}

function matchWord() {
  let flag = 0; //if 0 then the word not found yet
  for (let i = 0; i < dicionario.length; i++) {
    if(dicionario[i].substring(0, current_word.length) == current_word && flag == 0){  //check if the word is like one of those that are in dicionario
      show1 = dicionario[i];
      flag = 1;
      //break;
    }
    if(dicionario[i].substring(0, current_word.length) == current_word && dicionario[i] != show1){  //check if the word is like one of those that are in dicionario
      show2 = dicionario[i];
      break;
    }
    
  }
}


// Draws 2D keyboard UI (current letter and left and right arrows)
function draw2Dkeyboard()
{
  textAlign(CENTER, CENTER);

  const offsetX = width/2 - 2.0*PPCM;
  const offsetY = height/2 - 1.0*PPCM;
  const retSizeX = 4.0*PPCM/10;
  const retSizeY = 3.0*PPCM/4;
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 10; x++) {
        let xpos = x * retSizeX + offsetX;
        let ypos = y * retSizeY + offsetY;


        let index = y * 10 + x; // find the index

        if(inside(xpos, ypos, retSizeX,retSizeY)) {
          // were inside
          fill(255,255,255);
        } else {
          // not inside
          fill(255);
        }
        stroke(0); 
        strokeWeight(1);
        if((x == 0 && y == 0) || ( x == 5 && y == 0)) {
          rect(xpos, ypos, retSizeX*5, retSizeY, 2, 2 ,2, 2);
          fill(0);
          if (x < 4) {
            if(show1.length >= 9)
               textSize(15);
            if(show1.length >= 11)
               textSize(12);
            if (show1.length < 9)
              textSize(17);
            text(show1, xpos + (1.0 * PPCM), ypos+((3/8)*PPCM));
          }
          else {
            if(show2.length >= 9)
               textSize(15);
            if(show2.length >= 11)
               textSize(12);
            if (show2.length < 9)
              textSize(17);
            text(show2, xpos + (1.0 * PPCM), ypos+((3/8)*PPCM))
         
          }
          x+=4;
        }
        else if(x == 7 && y == 3) {
          rect(xpos, ypos, retSizeX*3, retSizeY, 2, 2 ,2, 2);
          x += 2;
        }
        //else (xpos > )
        else {
          rect(xpos, ypos, retSizeX, retSizeY, 2, 2 ,2, 2);
        }
        // colorMode(HSB);
        let h = map(index, 0, 255, 0, 255);
        fill(h);
        noStroke();
        textSize(12);
        text(arr[index], xpos, ypos, retSizeX,retSizeY);
      }
    }
}


  
  
function inside(x, y, w, h){
  if(mouseX > x && mouseX < x + w && mouseY > y && mouseY < y + h) {
    return true; 
   } 
  else {
    return false; 
  }
}


function getLetter() {
  
  const offsetX = width/2 - 2.0*PPCM;
  const offsetY = height/2 - 1.0*PPCM;
  const retSizeX = 4.0*PPCM/10;
  const retSizeY = 3.0*PPCM/4;
  if(FLAG_CLICK) {
  for (let y = 0; y < 4; y++) {
    for (let x = 0; x < 10; x++) {
        if(mouseX > (x * retSizeX + offsetX)  && mouseX < (x * retSizeX + offsetX + retSizeX) && mouseY >(y * retSizeY + offsetY) && 
           mouseY < (y * retSizeY + offsetY + retSizeY)) {
          index = y * 10 + x; // find the index
          
        }
      }
    }

  current_letter = arr[index].toLowerCase();
  }
}


function mouseReleased() {
  if (draw_finger_arm)
  {   
    
      // Check if mouse click happened within the touch input area
      if(mouseClickWithin(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM, 4.0*PPCM, 3.0*PPCM))  
      {    
          // Click in whitespace indicates a character input (2D keyboard)
          getLetter();
          
          if (current_letter == ' ') {
            currently_typed += " "; 
            current_word = "";
            counter = 0;
          }
            // if underscore, consider that a space bar
          else if (current_letter == '↩️' && currently_typed.length >= 0) {              // if `, treat that as delete
            currently_typed = currently_typed.substring(0,currently_typed.length - 1);
            current_word = current_word.substring(0, current_word.length -1);
            if(counter > 0)
              counter--;
          }
          else if (current_letter != '↩️') {
            currently_typed += current_letter;          
            current_word += current_letter;
            counter++;
          }
          matchWord();
          if(mouseClickWithin(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM, 4.0*PPCM, (3/4 *PPCM))){
            if(mouseClickWithin(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM, 2.0*PPCM, height/2 - 3/4 *PPCM)) {
              currently_typed = currently_typed.substring(0,currently_typed.length - counter+1);
              currently_typed += show1;
              counter = 0;
              current_word = "";
              
            }
            if(mouseClickWithin(width/2 , height/2 - 1.0*PPCM, 4.0*PPCM, height/2 - 3/4 *PPCM)) {
              currently_typed = currently_typed.substring(0,currently_typed.length - counter +1);
              currently_typed += show2;
              counter = 0;
              current_word = "";
            }
          }
          
        
          CPS++;
          
      }
    }
  FLAG_CLICK = false;
}


// Evoked when the mouse button was pressed
function mousePressed()
{
  // Only look for mouse presses during the actual test
  if (draw_finger_arm)
  {         
    // Check if mouse click happened within the touch input area
    if(mouseClickWithin(width/2 - 2.0*PPCM, height/2 - 1.0*PPCM, 4.0*PPCM, 3.0*PPCM))  
    {    
        // Click in whitespace indicates a character input (2D keyboard)
        FLAG_CLICK = true;

      }
    
    
    // Check if mouse click happened within 'ACCEPT' 
    // (i.e., submits a phrase and completes a trial)
    
    if (mouseClickWithin(width/2 - 2*PPCM, height/2 - 5.1*PPCM, 4.0*PPCM, 2.0*PPCM))
    {
      // Saves metrics for the current trial
      letters_expected += target_phrase.trim().length;
      letters_entered += currently_typed.trim().length;
      errors += computeLevenshteinDistance(currently_typed.trim(), target_phrase.trim());
      entered[current_trial] = currently_typed;
      trial_end_time = millis();
      
      current_letter       = '_';
      show1 = "the";
      show2 = "is";
      counter = 0;
      current_word = "";
      
      current_trial++;

      // Check if the user has one more trial/phrase to go
      if (current_trial < 2)                                           
      {
        // Prepares for new trial
        currently_typed = "";
        target_phrase = phrases[current_trial];  
      }
      else
      {
        // The user has completed both phrases for one attempt
        draw_finger_arm = false;
        attempt_end_time = millis();
        
        printAndSavePerformance();        // prints the user's results on-screen and sends these to the DB
        attempt++;

        // Check if the user is about to start their second attempt
        if (attempt < 2)
        {
          second_attempt_button = createButton('START 2ND ATTEMPT');
          second_attempt_button.mouseReleased(startSecondAttempt);
          second_attempt_button.position(width/2 - second_attempt_button.size().width/2, height/2 + 220);
        }
      }
    }
  }
}

// Resets variables for second attempt
function startSecondAttempt()
{
  // Re-randomize the trial order (DO NOT CHANG THESE!)
  shuffle(phrases, true);
  current_trial        = 0;
  target_phrase        = phrases[current_trial];
  
  // Resets performance variables (DO NOT CHANG THESE!)
  letters_expected     = 0;
  letters_entered      = 0;
  errors               = 0;
  currently_typed      = "";
  CPS                  = 0;
  
  current_letter       = '_';
  show1 = "the";
  show2 = "is";
  counter = 0;
  current_word = "";
  first = false;
  
  // Show the watch and keyboard again
  second_attempt_button.remove();
  draw_finger_arm      = true;
  attempt_start_time   = millis();  
}

// Print and save results at the end of 2 trials
function printAndSavePerformance()
{
  // DO NOT CHANGE THESE
  let attempt_duration = (attempt_end_time - attempt_start_time) / 60000;          // 60K is number of milliseconds in minute
  let wpm              = (letters_entered / 5.0) / attempt_duration;      
  let freebie_errors   = letters_expected * 0.05;                                  // no penalty if errors are under 5% of chars
  let penalty          = max(0, (errors - freebie_errors) / attempt_duration); 
  let wpm_w_penalty    = max((wpm - penalty),0);                                   // minus because higher WPM is better: NET WPM
  let timestamp        = day() + "/" + month() + "/" + year() + "  " + hour() + ":" + minute() + ":" + second();
  
  background(color(0,0,0));    // clears screen
  cursor();                    // shows the cursor again
  
  textFont("Arial", 16);       // sets the font to Arial size 16
  fill(color(255,255,255));    //set text fill color to white
  text(timestamp, 100, 20);    // display time on screen 
  
  text("Finished attempt " + (attempt + 1) + " out of 2!", width / 2, height / 2); 
  
  // For each trial/phrase
  let h = 20;
  for(i = 0; i < 2; i++, h += 40 ) 
  {
    text("Target phrase " + (i+1) + ": " + phrases[i], width / 2, height / 2 + h);
    text("User typed " + (i+1) + ": " + entered[i], width / 2, height / 2 + h+20);
  }
  
  text("Raw WPM: " + wpm.toFixed(2), width / 2, height / 2 + h+20);
  text("Freebie errors: " + freebie_errors.toFixed(2), width / 2, height / 2 + h+40);
  text("Penalty: " + penalty.toFixed(2), width / 2, height / 2 + h+60);
  text("WPM with penalty: " + wpm_w_penalty.toFixed(2), width / 2, height / 2 + h+80);
  text("CPS: " + (CPS/(attempt_duration * 60)) ,width / 2, height / 2 + h+100);

  // Saves results (DO NOT CHANGE!)
  let attempt_data = 
  {
        project_from:         GROUP_NUMBER,
        assessed_by:          student_ID,
        attempt_completed_by: timestamp,
        attempt:              attempt,
        attempt_duration:     attempt_duration,
        raw_wpm:              wpm,      
        freebie_errors:       freebie_errors,
        penalty:              penalty,
        wpm_w_penalty:        wpm_w_penalty,
        cps:                  CPS
  }
  
  // Send data to DB (DO NOT CHANGE!)
  if (BAKE_OFF_DAY)
  {
    // Access the Firebase DB
    if (attempt === 0)
    {
      firebase.initializeApp(firebaseConfig);
      database = firebase.database();
    }
    
    // Add user performance results
    let db_ref = database.ref('G' + GROUP_NUMBER);
    db_ref.push(attempt_data);
  }
}

// Is invoked when the canvas is resized (e.g., when we go fullscreen)
function windowResized()
{
  resizeCanvas(windowWidth, windowHeight);
  let display    = new Display({ diagonal: display_size }, window.screen);
  
  // DO NO CHANGE THESE!
  PPI           = display.ppi;                        // calculates pixels per inch
  PPCM          = PPI / 2.54;                         // calculates pixels per cm
  FINGER_SIZE   = (int)(11   * PPCM);
  FINGER_OFFSET = (int)(0.8  * PPCM)
  ARM_LENGTH    = (int)(19   * PPCM);
  ARM_HEIGHT    = (int)(11.2 * PPCM);
  
  ARROW_SIZE    = (int)(2.2 * PPCM);

  
  // Starts drawing the watch immediately after we go fullscreen (DO NO CHANGE THIS!)
  draw_finger_arm = true;
  attempt_start_time = millis();
}