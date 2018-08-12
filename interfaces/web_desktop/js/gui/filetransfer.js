Application.run = function( msg )
{
	// Setup progress bar
	var eled = document.body.getElementsByTagName( 'div' );
	var groove = bar = frame = progressbar = info = false;
	for( var a = 0; a < eled.length; a++ )
	{
		if( eled[a].className )
		{
			var types = [ 'ProgressBar', 'Groove', 'Frame', 'Bar', 'Info' ];
			for( var b = 0; b < types.length; b++ )
			{
				if( eled[a].className.indexOf( types[b] ) == 0 )
				{
					switch( types[b] )
					{
						case 'ProgressBar': progressbar    = eled[a]; break;
						case 'Groove':      groove         = eled[a]; break;
						case 'Frame':       frame          = eled[a]; break;
						case 'Bar':         bar            = eled[a]; break;
						case 'Info':		info           = eled[a]; break;
					}
					break;
				}
			}
		}
	}
	
	// Only continue if we have everything
	if( progressbar && groove && frame && bar )
	{
		progressbar.style.position = 'relative';
		frame.style.width = '100%';
		frame.style.height = '40px';
		groove.style.position = 'absolute';
		groove.style.width = '100%';
		groove.style.height = '30px';
		groove.style.top = '0';
		groove.style.left = '0';
		bar.style.position = 'absolute';
		bar.style.width = '2px';
		bar.style.height = '30px';
		bar.style.top = '0';
		bar.style.left = '0';

		// Preliminary progress bar
		bar.total = 1;
		bar.items = 1;
	}
	
	this.bar = bar;
	this.info = info;
}


Application.receiveMessage = function( msg )
{
	console.log( 'File transfer receives: ', msg );
	if( msg.command == 'progress' )
	{
		this.bar.style.width = Math.floor( Math.max(1, msg.value ) ) + '%';
		this.bar.innerHTML = '<div class="FullWidth" style="text-overflow: ellipsis; text-align: center; line-height: 30px; color: white">' +
			Math.floor( value ) + '%</div>';
	}
	else if( msg.command == 'progress_information' )
	{
		if( this.info )
		{
			this.info.innerHTML = this.info.innerHTML = '<div id="transfernotice" style="padding-top:10px;">' +
					'Transferring files to target volume...</div>';
		}
	}
	else if( msg.command == 'progress_error' )
	{
		if( this.info )
		{
			this.info.innerHTML = '<div style="color:#F00; padding-top:10px; font-weight:700;">' + msg.data + '</div>';
		}
	}
}

function cancelFileTransfer()
{
	Application.sendMessage( { command: 'file_transfer_cancel' } );
}

