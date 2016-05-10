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
