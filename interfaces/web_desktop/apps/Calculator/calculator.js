/*
 * Copyright (C) 2012 Ideaviate AB
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy 
 * of this software and associated documentation files (the "Software"), to deal 
 * in the Software without restriction, including without limitation the rights 
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell 
 * copies of the Software, and to permit persons to whom the Software is 
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all 
 * copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, 
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN 
 * CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

var Calculator = function () {

    // Helper variable declarations
    var self = this,
        decimalMark = ".",
        sum = 0,
        prevOperator;

    // Define default values
    self.display = ko.observable("0");
    self.isShowingResult = ko.observable(false);

    // Callback for each number button
    self.number = function (item, event) {   
        var button = event.target.innerText || event.target.textContent;

        // If a result has been shown, make sure we
        // clear the display before displaying any new numbers
        if (self.isShowingResult()) {
            self.clearDisplay();
            self.isShowingResult(false);
        }

        // Make sure we only add one decimal mark
        if (button == decimalMark && self.display().indexOf(decimalMark) > -1)
            return;

        // Make sure that we remove the default 0 shown on the display
        // when the user press the first number button
        var newValue = (self.display() === "0" && button != decimalMark) ? button : self.display() + button; 
        // Update the display
        self.display(newValue);
    };

    // Callback for each operator button
    self.operator = function (item, event) {
        var button = event.target.innerText || event.target.textContent;
        // Only perform calculation if numbers
        // has been entered since last operator button was pressed
        if (!self.isShowingResult()) {
            // Perform calculation
            switch (prevOperator) {
                case "+":
                    sum = sum + parseFloat(self.display(), 10);
                    break;
                case "-":
                    sum = sum - parseFloat(self.display(), 10);
                    break;
                case "x":
                    sum = sum * parseFloat(self.display(), 10);
                    break;
                case "÷":
                    sum = sum / parseFloat(self.display(), 10);
                    break;
                default:
                    sum = parseFloat(self.display(), 10);
            };
        }

        // Avoid showing a result until you have at least
        // two terms to perform calculation on
        if (prevOperator)
            self.display(sum);

        // Make sure we don't try to calculate with the equal sign
        prevOperator = (button === "=") ? null : button;
        // Always set the calculator into showing result state 
        // after an operator button has been pressed
        self.isShowingResult(true);
    };

    // Callback for negating a number
    self.negate = function () {
        // Disable the negate button when showing a result
        if (self.isShowingResult() || self.display() === "0")
            return;

        var newValue = (self.display().substr(0, 1) === "-") ? self.display().substr(1) : "-" + self.display();
        self.display(newValue);
    };

    // Callback for each backspace button
    self.backspace = function (item, event) {
        // Disable backspace if the calculator is shown a result
        if (self.isShowingResult())
            return;

        // Remove the last character, and make the display zero when
        // last character is removed
        if (self.display().length > 1) {
            self.display(self.display().substr(0, self.display().length - 1));
        } else {
            self.clearDisplay();
        }
    };

    // Clear the entire calculator
    self.clear = function () {
        prevOperator = null;
        self.clearDisplay();
        sum = 0;
    };

    // Clear just the display
    self.clearDisplay = function () {
        self.display("0");
    };
};

// Enable keyboard controll
(function () {
    // Key codes and their associated calculator buttons
    var calculatorKeys = {
        48: "0", 49: "1", 50: "2", 51: "3", 52: "4", 53: "5", 54: "6",
        55: "7", 56: "8", 57: "9", 96: "0", 97: "1", 98: "2", 99: "3",
        100: "4", 101: "5", 102: "6", 103: "7", 104: "8", 105: "9",
        106: "x", 107: "+", 109: "-", 110: ".", 111: "÷", 8: "backspace",
        13: "=", 46: "c", 67: "c"
    };

    // Helper function to fire an event on an element
    function fireEvent(element, event) {
        if (document.createEvent) {
            // Dispatch for firefox + others
            var evt = document.createEvent("HTMLEvents");
            evt.initEvent(event, true, true);
            return !element.dispatchEvent(evt);
        } else {
            // Dispatch for IE
            var evt = document.createEventObject();
            return element.fireEvent('on' + event, evt)
        }
    }

    // Helper functions to add/remove HTML-element classes
    // as IE didn't support the classList property prior to IE10
    function hasClass(ele, cls) {
        return ele.className.match(new RegExp('(\\s|^)' + cls + '(\\s|$)'));
    }

    function addClass(ele, cls) {
        if (!hasClass(ele, cls)) ele.className += " " + cls;
    }

    function removeClass(ele, cls) {
        if (hasClass(ele, cls)) {
            var reg = new RegExp('(\\s|^)' + cls + '(\\s|$)');
            ele.className = ele.className.replace(reg, ' ');
        }
    }

    // Callback for every key stroke
    var keycallback = function (e) {
        // Check if the key was one of our calculator keys
        if (e.keyCode in calculatorKeys) {
            // Get button-element associated with key
            var element = document.getElementById("calculator-button-" + calculatorKeys[e.keyCode]);
            // Simulate button click on keystroke
            addClass(element, "active");
            setTimeout(function () { removeClass(element, "active"); }, 100);
            // Fire click event
            fireEvent(element, "click");
        }
    }

    // Attach a keyup-event listener on the document
    if (document.addEventListener) {
        document.addEventListener('keyup', keycallback, false);
    } else if (document.attachEvent) {
        document.attachEvent('keyup', keycallback);
    }
})();


function initCalc()
{
	if( typeof( ko ) != 'undefined' )
	{
		// Apply knockout bindings
		return ko.applyBindings(new Calculator());
	}
	return setTimeout( function(){ initCalc() }, 5 );
}
initCalc();
