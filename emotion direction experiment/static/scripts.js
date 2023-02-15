var baseline_delay = 120000;
var rest_delay = 5000;
var fade_delay = 500;

var SAM_points = 9;//5;

function init() {
    websocketConnect();

    $('body .start').removeClass("hidden");
    // $('body .sam').removeClass("hidden");

    $('button[transition]').click(function() {
        target = $(this).attr('transition')
        changePage($(target), target);
    });

    $('#button-to-baseline').click(function() {
        showBaseline(baseline_delay);
    });

    $('#button-to-experiment').click(function() {
        showRest(rest_delay);
    });

    $('#progress-ok-button').click(function() {
        showRest(rest_delay);
    });

    $('#sam-submit-button').click(function() {
        // submitSAM();
        showProgress();
    });

    $('#questionnaire-submit-button').click(function() {
        setTimeout(function() { $('.questionnaire button').addClass('transparent'); }, fade_delay);
        showProgress();
    });

    mannequinRender();
}

window.addEventListener('load', init, false);

function mannequinRender() {
    $('#arousalExplanationImage').attr('src', 'static/SAM_aro' + SAM_points + '.jpg');
    $('#valienceExplanationImage').attr('src', 'static/SAM_val' + SAM_points + '.jpg');
    $('#likingExplanationImage').attr('src', 'static/SAM_lik' + SAM_points + '.jpg');
    $('#arousal img').attr('src', 'static/SAM_aro' + SAM_points + '.jpg');
    $('#valence img').attr('src', 'static/SAM_val' + SAM_points + '.jpg');
    $('#liking img').attr('src', 'static/SAM_lik' + SAM_points + '.jpg');
    for (let i = 0; i < SAM_points; i++) {
        var $arousal_input = $('<input type="radio" name="arousal" value="' + i + '">');
        var $valence_input = $('<input type="radio" name="valence" value="' + i + '">');
        var $liking_input = $('<input type="radio" name="liking" value="' + i + '">');
        $('#arousal p').append($arousal_input);
        $('#valence p').append($valence_input);
        $('#liking p').append($liking_input);
        $arousal_input.wrap('<label>');
        $valence_input.wrap('<label>');
        $liking_input.wrap('<label>');
        $arousal_input.click(function() { mannequinEval($(this)); });
        $valence_input.click(function() { mannequinEval($(this)); });
        $liking_input.click(function() { mannequinEval($(this)); });
    }
    $('.sam').addClass('sam-' + SAM_points);
}

function mannequinEval(e) {
    valence = $('.sam [name=valence]:input:checked').val();
    arousal = $('.sam [name=arousal]:input:checked').val();
    liking = $('.sam [name=liking]:input:checked').val();

    if(arousal && valence && liking) {
        $('.sam > button').removeClass('transparent');
    }

    websocketSend(e.attr('name') + ' ' + e.attr('value'));
}


// ---
// Websocket
// ---

function websocketConnect(openFcn) {
    url ='ws://localhost:8001/';

    websocket = new WebSocket(url);
    websocket.onopen = function(evt) { websocketOpen(evt); };
    websocket.onclose = function(evt) { websocketClose(evt) };
    websocket.onmessage = function(evt) { websocketMessage(evt) };
    websocket.onerror = function(evt) { websocketError(evt) };
}

function websocketOpen(evt) {
    console.log('connected\n');
}

function websocketClose(evt) {
    console.log('disconnected\n');
}

function websocketError(evt) {
    console.log('error: ' + evt.data + '\n');

    websocket.close();
}

function websocketDisconnect() {
    websocket.close();
}

function websocketSend(message) {
    if(websocket.readyState === 1) {
        websocket.send(message);
        console.log('sent: ' + message + '\n'); 
    } else {
        setTimeout(websocketSend, 5, message);
    }
}

var experiment_type = '';
var block_end = false;
var experiment_end = false;
var experiment_progress = 0;

function websocketMessage(evt) {
    console.log('received: ' + evt.data + '\n');

    if(evt.data.substring(0, 6) == 'sample') {
        showSAM();
    } else if(evt.data.substring(0, 5) == 'block') {
        block_end = true;
        if(evt.data.length > 5 && evt.data[6] == '0') experiment_progress = parseFloat(evt.data.split(' ')[1]); // TODO: should do more safety checks...
        showSAM();
    } else if(evt.data.substring(0, 4) == 'type') {
        experiment_type = evt.data.split(' ')[1];
    } else if(evt.data.substring(0, 3) == 'end') {
        block_end = true;
        experiment_end = true;
        showSAM();
    }
}



// ---
// Experiment change page
// ---

function slowScrollToTop() {
    $('html, body').animate({ scrollTop: 0 }, 'slow');
}

function changePage(toElem, message='') {
    $('button').prop('disabled', true); // prevent user from clicking buttons twice while transitioning
    slowScrollToTop();

    fromElem = $('body > div:not(.hidden)');

    if(fromElem.length > 0) {
        fromElem.fadeOut(fade_delay, function() {
            fromElem.addClass('hidden');
            fromElem.attr('style', '');
            toElem.removeClass('hidden');
            $('button').prop('disabled', false);
        });
    } else
        toElem.removeClass('hidden');

    if(message) websocketSend(message);
}


// ---
// Experiment rest pages
// ---

function showBaseline(rest_delay) {
    changePage($('.rest'), 'baseline ' + rest_delay);

    startCountdown(rest_delay);
    setTimeout(function() {
        changePage($('.pre-experiment'), 'pre-experiment');
    }, rest_delay);
}

function startCountdown(ms) {
    minutes = (ms/1000) / 60;
    seconds = (ms/1000) % 60;
    $('#counter p').html(String(parseInt(minutes)).padStart(2, '0') + ":" + String(parseInt(seconds)).padStart(2, '0'));

    if(ms > 0) {
        setTimeout(function() {
            startCountdown(ms-1000);
        }, 1000);
    }
}

function showRest(rest_delay) {
    changePage($('#rest'), 'rest ' + rest_delay);
    setTimeout(prepareSample, rest_delay);
}


// ---
// Experiment music preparation and signal
// ---

function prepareSample() {
    playSample();
    changePage($('#play'));
}

function playSample() {
    websocketSend('play');
}


// ---
// Experiment questions
// ---

function showSAM() {
    $('.sam input').prop('checked', false);
    changePage($('.sam'));
}

function submitSAM() {
    // if(block_end) {
    //     block_end = false;
    //     showQuestionnaire();
    // } else {
    //     showRest(rest_delay);
    // }
    showRest(rest_delay);
    setTimeout(function() { $('.sam button').addClass('transparent'); }, fade_delay);
}

function showQuestionnaire() {
    $('.questionnaire input').prop('checked', false);
    changePage($('.questionnaire'), '.questionaire');
}


// ---
// Show progress to user
// ---

shown_progress = 0.;
function showProgress() {
    if(experiment_end) {
        experiment_end = false;
        showEnd();
    } else if(experiment_progress >= 0.75 && shown_progress < 0.75) {
        experiment_progress = shown_progress = 0.75;
        showProgress();
    } else if(experiment_progress >= 0.5 && shown_progress < 0.5) {
        experiment_progress = shown_progress = 0.5;
        showProgress();
    } else if(experiment_progress >= 0.25 && shown_progress < 0.25) {
        experiment_progress = shown_progress = 0.25;
        showProgress();
    } else {
        showRest(rest_delay);
    }
}


// ---
// Progress panel
// ---

function showProgress() {
    $('span#progress').html(experiment_progress*100);
    changePage($('.progress'), 'progress ' + experiment_progress);
}


// ---
// Experiment end
// ---

function showEnd() {
    fromElem = $('body div:not(.hidden)')
    $('.mannequin input').prop('checked', false);
    changePage($('#thanks'));
}