/**
 * Created by Hayk on 2/04/2017.
 */

var URL = "https://restcountries.eu/rest/v2/";
var COUNTRIES = [];
var CURRENT = {
    count: 5,
    countries: undefined,
    mixedIndexes: undefined,
    timerExpired: true,
    withTimer: false,
    holdTimer: false,
    timerStep: 100
};
var TIMER_AGE = 30000;

var Country = function (country) {
    this.id = country.numericCode;
    this.name = country.name;
    this.flag = country.flag;
    this.nativeName = country.nativeName;
};

var findAll = function () {
    var url = URL + "all";
    $.ajax({
        url: url,
        dataType: "json"
    }).done(function (data) {
        fillCountries(data);
    }).fail(function (jqXHR, textStatus, errorThrown) {
        console.log(errorThrown);
    });
};

var fillCountries = function (data) {
    data.forEach(function (country) {
        COUNTRIES.push(new Country(country));
    });
    COUNTRIES.push(new Country({
        numericCode: "000",
        name: "Nagorno Karabach",
        flag: "https://upload.wikimedia.org/wikipedia/commons/thumb/8/8d/Flag_of_Nagorno-Karabakh.svg/1080px-Flag_of_Nagorno-Karabakh.svg.png",
        nativeName: "Արցախ"
    }));
    var event = jQuery.Event('ajax.ready');
    $(document).trigger(event);
};

var startGame = function (e) {
    if (CURRENT.withTimer && ! CURRENT.timerExpired) {
        prepareTimerToStart();
    }
    resetValues();
    initCurrent();
    fillDataToHtml();
    initDraggableDroppable();
};

var resetValues = function () {
    $('#score-success').text('0');
    $('#total-scores-modal').find('.modal-body').empty();
};

var initCurrent = function () {
    initCountries();
    initMixedIndexes();
};

var initCountries = function () {
    if (COUNTRIES.length > 0) {
        CURRENT.countries = [];
        var indexes = getRandomUniqueIndexes(CURRENT.count, COUNTRIES.length);
        indexes.forEach(function (index) {
            CURRENT.countries.push(COUNTRIES[index]);
        });
    }
};

var initMixedIndexes = function () {
    CURRENT.mixedIndexes =
        getRandomUniqueIndexes(CURRENT.count);
};

var fillDataToHtml = function () {
    var $draggables = $('.draggables').find('.flags-container').empty();
    var $droppables = $('.droppables').find('.flags-container').empty();
    for (var i = 0; i < CURRENT.count; i++) {
        $draggables.append(jFlag(CURRENT.countries[CURRENT.mixedIndexes[i]]));
        $droppables.append(jDroppable(CURRENT.countries[i], i));
    }
    $('[data-toggle="tooltip"]').tooltip();
};

var jFlag = function (country) {
    var $img = $('<img>').attr({
        alt: country.id,
        title: "flag",
        src: country.flag
    });
    var $thumbnailImage = $('<div class="thumbnail-image">').html($img);
    return $('<div class="thumbnail">').html($thumbnailImage);
};

var jDroppable = function (country, index) {
    var $h3 = $('<h3>').attr({
        'data-toggle': "tooltip",
        'title': country.name + " - " + country.nativeName
    }).text(country.name);
    var $thumbnailTitle = $('<div class="thumbnail-title">').html($h3);
    var $thumbnailImage = $('<div class="thumbnail-image">').attr('data-id', index)
        .html($thumbnailTitle);
    return $('<div class="thumbnail">').html($thumbnailImage);
};

var getRandomIndex = function (max) {
    return ~~(Math.random() * max);
};

var getRandomUniqueIndexes = function (count, max) {
    if (max == undefined) {
        max = count;
    }
    var indexes = [];
    for (var i = 0; i < count; i++) {
        var index = getRandomIndex(max);
        if (! indexes.includes(index)) {
            indexes.push(index);
        } else {
            i--;
        }
    }
    return indexes;
};

var initDraggableDroppable = function() {
    initDraggable();
    initDroppable();
};

var initDraggable = function () {
    $('.draggables img').draggable({
        revert: function(event, ui) {
            return !event;
        }
    });
};

var initDroppable = function () {
    $('.droppables .thumbnail-image').droppable(
        {
            accept: ".draggables img",
            drop: function(e, ui)
            {
                checkAnswer($(this), ui);
            }
        }
    );
};

var checkAnswer = function($droppable, ui) {
    $droppable.append(getCurrentDraggable(ui))
        .droppable('disable');
    setAnswerClass($droppable);
};

var setAnswerClass = function($droppable) {
    var dropMask = CURRENT.countries[parseInt($droppable.attr('data-id'))].id;
    var dragMask = parseInt($droppable.find('img').attr('alt'));

    var answerClass;
    if (dropMask == dragMask) {
        answerClass = "success";
    } else {
        answerClass = "danger";
    }
    $droppable.parent().addClass(answerClass);
    checkScores();
};

var checkScores = function () {
    var success = $('.droppables .success').length;
    $('#score-success').text(success);
    if (isGameOver()) {
        showTotalScore(success);
    }
};

var isGameOver = function () {
    return $('.droppables img').length == CURRENT.count;
};

var showTotalScore = function (success) {
    var $modal = $('#total-scores-modal');
    var message = '';
    if (success == CURRENT.count) {
        message = "You won!"
    } else {
        message = "You lost!"
    }
    $modal.find('.modal-body').html($('<p>').text(message));
    $modal.modal('show');
};

var getCurrentDraggable = function (ui) {
    ui.draggable.draggable('disable');
    var $draggable = $(ui.draggable);
    $(ui.draggable).parent().remove();
    $draggable.removeAttr("class").removeAttr("style");
    return $draggable;
};

var checkCheckboxStyles = function ($checkbox) {
    var $label = $checkbox.next('label');
    $label.find('i').remove();
    var text = $label.text();
    $label.empty();
    var $icon = $('<i class="fa fa-fw">');
    if ($checkbox.is(':checked')) {
        $icon.addClass('fa-check-square');
    } else {
        $icon.addClass('fa-square-o');
    }
    $label.html($icon).append(text);
};

var checkCheckboxStyle = function (e) {
    checkCheckboxStyles($(this));
};

var setTimer = function (e) {
    var $timer = $('.timer');
    if ($(this).is(':checked')) {
        CURRENT.withTimer = true;
        $timer.show();
        prepareTimerToStart();
        clickReset();
        tick();
    } else {
        CURRENT.withTimer = false;
        prepareTimerToStop();
        $timer.hide();
    }
};

var prepareTimerToStart = function () {
    CURRENT.timerExpired = false;
    resetTimerAge();
    setProgressValueNow(TIMER_AGE);
    updateProgress();
};

var prepareTimerToStop = function () {
    CURRENT.timerExpired = true;
    resetTimerAge();
    setProgressValueNow(0);
    updateProgress();
};

var tick = function () {
    if (!CURRENT.holdTimer) {
        if (CURRENT.withTimer) {
            if (! CURRENT.timerExpired) {
                window.setTimeout(function () {
                    updateProgress();
                    tick();
                }, CURRENT.timerStep);
            } else {
                prepareTimerToStart();
                clickReset();
                tick();
            }
        } else {
            clickReset();
        }
    }
};

var clickReset = function () {
    $('#reset-button').trigger('click');
};

var resetTimerAge = function () {
    $('.timer').attr('data-timer-age', TIMER_AGE);
};

var updateProgress = function () {
    var $timer = $('.timer');
    var valueNow = parseInt($timer.attr('aria-valuenow')) - CURRENT.timerStep;
    if (valueNow < 0) {
        valueNow = 0;
    }
    if (valueNow == 0) {
        CURRENT.timerExpired = true;
    }
    setProgressValueNow(valueNow);
    var pct = ~~(100 * valueNow / TIMER_AGE) + '%';
    $timer.css('width', pct);
};

var setProgressValueNow = function (valuenow) {
    $('.timer').attr('aria-valuenow', valuenow);
};

var holdTimer = function () {
    CURRENT.holdTimer = true;
};

var restartGame = function () {
    CURRENT.holdTimer = false;
    CURRENT.timerExpired = true;
    tick();
};

var init = function () {
    var $checkbox = $('.checkbox');
    checkCheckboxStyles($checkbox);
    findAll();
    $(document).on('ajax.ready', startGame);
    $checkbox.on('change', checkCheckboxStyle);
    $('#reset-button').on('click', startGame);
    $('#with-timer').on('change', setTimer);
    $('#total-scores-modal').on('shown.bs.modal', holdTimer)
        .on('hidden.bs.modal', restartGame);
    $('.countries+div').hide();

};

$(document).ready(init);