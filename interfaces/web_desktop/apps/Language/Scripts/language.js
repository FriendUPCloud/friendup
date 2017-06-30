/*©agpl*************************************************************************
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
*****************************************************************************©*/

Application.run = function( msg, iface )
{
	var v = new View( {
		title: i18n( 'gui_language' ),
		width: 700,
		height: 500
	} );
	
	this.mainView = v;
	
	v.onClose = function()
	{
		Application.quit();
	}
	
	var f = new File( 'Progdir:Templates/main.html' );
	f.replacements = {
		locale: i18n( 'i18n_locale' ),
		locale_language: i18n( 'i18n_locale_language' ),
		loading_languages: i18n( 'i18n_loading_languages' ),
		speech_settings: i18n( 'i18n_speech_settings' ),
		preferred_speech: i18n( 'i18n_preferred_speech' ),
		speech_advice: i18n( 'i18n_speech_advice' ),
		loading_voices: i18n( 'i18n_loading_voices' ),
		alternative_speech: i18n( 'i18n_alternative_speech' ),
		fallback_advice: i18n( 'i18n_fallback_advice' ),
		save: i18n( 'i18n_save' ),
		cancel: i18n( 'i18n_cancel' )
	};
	f.onLoad = function( data )
	{
		v.setContent( data );
	}
	f.load();
}


Application.receiveMessage = function( msg )
{
	if( !msg.command ) return;
	if( msg.command == 'saving' )
	{
		this.mainView.setTitle( i18n( 'gui_language' ) + ' - Saving settings...' );
	}
	else if( msg.command == 'saved' )
	{
		this.mainView.setTitle( i18n( 'gui_language' ) );
	}
}
