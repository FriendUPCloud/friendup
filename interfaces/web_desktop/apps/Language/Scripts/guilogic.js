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

Application.run = function( msg, iface )
{
	updateVoices();
}

function updateVoices()
{
	if( !ge( 'voices' ) || speechSynthesis.getVoices().length <= 0 ) return setTimeout( 'updateVoices()', 150 );
	var u = new SpeechSynthesisUtterance( 'hello' );
	var v = speechSynthesis.getVoices();
	var curr = globalConfig.language;
	var opts = '';
	for( var a = 0; a < v.length; a++ )
	{
		var o = '';
		if( v[a].lang == curr ) o = ' selected="selected"';
		opts += '<option value="' + v[a].lang + '"' + o + '>' + ( v[a].name + ' ' + v[a].lang ) + '</option>';
	}
	ge( 'voices' ).innerHTML = opts;
	
	// Alternate
	curr = globalConfig.alternateLanguage ? globalConfig.alternateLanguage : 'en-US';
	opts = '';
	for( var a = 0; a < v.length; a++ )
	{
		var o = '';
		if( v[a].lang == curr ) o = ' selected="selected"';
		opts += '<option value="' + v[a].lang + '"' + o + '>' + ( v[a].name + ' ' + v[a].lang ) + '</option>';
	}
	ge( 'voices_alternate' ).innerHTML = opts;
}

function quitApp()
{
	Application.quit();
}

function saveSettings()
{
	var o = {
		spokenLanguage: ge( 'voices' ).value,
		spokenAlternate: ge( 'voices_alternate' ).value
	};

	var m = new Module( 'system' );
	m.onExecuted = function( e, d )
	{
		Application.sendMessage( { command: 'info', value: 'saved' } );
		Application.sendMessage( { type: 'system', command: 'reload_user_settings' } );
	}
	m.execute( 'setsetting', { setting: 'language', data: o } );
	Application.sendMessage( { command: 'info', value: 'saving' } );
}
