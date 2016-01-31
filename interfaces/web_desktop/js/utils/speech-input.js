/*******************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*******************************************************************************/

/*global webkitSpeechRecognition */

function InitSpeechControls()
{
	'use strict';

	if (! ('webkitSpeechRecognition' in window) ) return;

	var talkMsg = 'start talking';
	var patience = 6;

	function capitalize(str)
	{
		return str.length ? str[0].toUpperCase() + str.slice(1) : str;
	}

	var speechInputWrappers = document.getElementsByClassName('si-wrapper');

	[].forEach.call(speechInputWrappers, function(speechInputWrapper) 
	{
		// find elements
		var inputEl = speechInputWrapper.querySelector('.si-input');
		var micBtn = speechInputWrapper.querySelector('.si-btn');

		// size and position them
		speechInputWrapper.appendChild( micBtn );

		// setup recognition
		var finalTranscript = '';
		var recognizing = false;
		var timeout;
		var oldPlaceholder = null;
		var recognition = new webkitSpeechRecognition();
		micBtn.recognition = recognition;
		recognition.continuous = true;
		recognition.speaking = false;

		function restartTimer()
		{
		/*	timeout = setTimeout(function()
			{
				recognition.stop();
			}, patience * 1000);*/
		}

		recognition.onstart = function()
		{
			oldPlaceholder = inputEl.placeholder;
			inputEl.placeholder = talkMsg;
			recognizing = true;
			micBtn.classList.add('listening');
			restartTimer();
		};

		recognition.onend = function()
		{
			console.log( 'Ok, we got thrown out!' );
			recognizing = false;
			//clearTimeout(timeout);
			micBtn.classList.remove('listening');
			if (oldPlaceholder !== null) inputEl.placeholder = oldPlaceholder;
		};
		
		recognition.onerror = function( event )
		{
			console.log( 'Error occured:', event );
		}

		recognition.onbeginningofspeech = function( event )
		{
			console.log( 'Beginning of speech: ', event );
			this.speaking = true;
		}

		recognition.onendofspeech = function( event )
		{
			console.log( 'End of speech:', event );
			this.speaking = false;
		}

		recognition.onresult = function( event )
		{
			//clearTimeout(timeout);
			for (var i = event.resultIndex; i < event.results.length; ++i)
			{
				if (event.results[i].isFinal)
				{
					finalTranscript += event.results[i][0].transcript;
				}
			}
			//finalTranscript = capitalize(finalTranscript);
			//inputEl.value = finalTranscript;
			Doors.shell.voiceParse( finalTranscript );
			console.log( 'Transcript: ' + finalTranscript );
			finalTranscript = '';
			setTimeout( function(){ inputEl.focus(); }, 100 );
			//restartTimer();
		};

		micBtn.addEventListener('click', function(event)
		{
			event.preventDefault();
			if (recognizing) 
			{
				recognition.stop();
				return;
			}
			inputEl.value = finalTranscript = '';
			recognition.start();
		}, false);
	});
}

// Say something
function Say( string, mode )
{	
	if( !mode && typeof( speechSynthesis ) != 'undefined' )
	{
		var v = speechSynthesis.getVoices();
		var u = new SpeechSynthesisUtterance( string );
		u.lang = 'en-US';
		for( var a = 0; a < v.length; a++ )
		{
			if( v[a].name == 'Google US English' )
			{
				u.lang = v[a].lang;
				u.voice = v[a].voiceURI;
				break;
			}
		}
		speechSynthesis.speak( u );
	}
	//else
	//{
		var d = document.createElement( 'div' );
		d.className = 'SpeechResponse';
		var r = document.createElement( 'div' );
		r.className = 'Response';
		r.innerHTML = string;
		d.style.opacity = 1;
		d.style.zIndex = 999999;
		d.appendChild( r );
		document.body.appendChild( d );
		setTimeout( function()
		{
			d.style.opacity = 0;
			setTimeout( function()
			{
				document.body.removeChild( d );
			}, 600 );
		}, 2500 );
	//}
}

