/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/

/*global webkitSpeechRecognition */
function InitSpeechControls( callback )
{
	'use strict';

	if (! ('webkitSpeechRecognition' in window) ) return;

	var talkMsg = 'start talking';
	var patience = 6;

	function capitalize(str)
	{
		return str.length ? str[0].toUpperCase() + str.slice(1) : str;
	}

	var microphoneIcon = ge( 'Tray' ).getElementsByClassName( 'Microphone' );
	if( microphoneIcon.length ) microphoneIcon = microphoneIcon[0];
	
	var speechInputWrappers = document.getElementsByClassName('si-wrapper');

	var inited = false;

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
		microphoneIcon.recognition = recognition;
		recognition.continuous = true;
		recognition.speaking = false;

		recognition.onstart = function()
		{
			this.hasStarted = true;
			oldPlaceholder = inputEl.placeholder;
			inputEl.placeholder = talkMsg;
			recognizing = true;
			ge( 'Handsfree' ).classList.add('listening');
			if( !inited && callback )
			{
				inited = true;
				callback();
			}
			console.log( 'Recognizing started.' );
		};

		recognition.onend = function()
		{
			this.hasStarted = false;
			recognizing = false;
			ge( 'Handsfree' ).classList.remove( 'listening' );
			
			if( oldPlaceholder !== null )
				inputEl.placeholder = oldPlaceholder;
			console.log( 'Recognizing stopped.' );
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
			for( var i = event.resultIndex; i < event.results.length; ++i )
			{
				if( event.results[i].isFinal )
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
		};

		micBtn.addEventListener('click', function(event)
		{
			event.preventDefault();
			if( recognizing )
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
function Say( string, language, mode )
{	
	if( !mode || ( mode && mode == 'both' ) )
	{
		var v = speechSynthesis.getVoices();
		var u = new SpeechSynthesisUtterance( string );
		u.lang = language ? language : globalConfig.language;
		try
		{

			for( var a = 0; a < v.length; a++ )
			{
				console.log('Voice...',v[a]);

				if( v[a].name == 'Google US English' && u.lang == 'en-US' )
				{
					u.lang = v[a].lang;
					u.voice = v[a].voiceURI;
					break;
				}
				else if( v[a].name == u.lang )
				{
					u.lang = v[a].lang;
					u.voice = v[a].voiceURI;
					break;
				}
			}
		}
		catch(e) { console.log('Could not set lang/voice',e); }
		
		var stopper = ge( 'Tray' ).getElementsByClassName( 'Microphone' );
		if( stopper.length ) stopper = stopper[0];
		u.onend = function()
		{
			if( this.endTimeout ){ clearTimeout( this.endTimeout ); this.endTimeout = false; }
			//console.log( 'Synthetic speech stopped.' );
			if( stopper && stopper.recognition && !stopper.recognition.hasStarted )
			{
				try
				{
					//console.log( 'Trying to restart' );
					stopper.recognition.start();
					stopper.className = 'Microphone IconSmall fa-microphone';
				}
				catch( e )
				{
					//console.log( 'Could not do it', e );
					InitSpeechControls();
				}
			}
			else if( stopper && !stopper.recognition )
			{
				stopper.className = 'Microphone IconSmall fa-microphone-slash';
				//console.log( 'Seems we were thrown out Reinitialize!!' );
				InitSpeechControls();
			}
			else
			{
				//console.log( 'We stopped talking, but we don\'t know what\'s happening.', stopper, stopper.recognition );
			}
		}
		if( stopper && stopper.recognition ) 
		{
			stopper.recognition.stop();
			stopper.className = 'Microphone IconSmall fa-microphone-slash';
		}
		speechSynthesis.speak( u );
		u.endTimeout = setTimeout( function(){ u.onend(); }, string.split( ' ' ).length * 800 );
		
	}
	
	if( mode && ( mode == 'text' || mode == 'both' ) )
	{
		// This one has some extra
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
	}
}

