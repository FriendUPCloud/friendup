/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
* Copyright (c) Friend Software Labs AS. All rights reserved.                  *
*                                                                              *
* Licensed under the Source EULA. Please refer to the copy of the GNU Affero   *
* General Public License, found in the file license_agpl.txt.                  *
*                                                                              *
*****************************************************************************©*/
Application.run = function( msg )
{
	document.body.onkeyup = function( e )
	{
		var k = e.which ? e.which : e.keyCode;
		switch( k )
		{
			// 7
			case 36:
				document.getElementById( 'calculator-button-7' ).click();
				break;
			// 8
			case 38:
				document.getElementById( 'calculator-button-8' ).click();
				break;
			// 9
			case 33:
				document.getElementById( 'calculator-button-9' ).click();
				break;
			// 4
			case 37:
				document.getElementById( 'calculator-button-4' ).click();
				break;
			// 5
			case 12:
				document.getElementById( 'calculator-button-5' ).click();
				break;
			// 6
			case 39:
				document.getElementById( 'calculator-button-6' ).click();
				break;
			// 1
			case 35:
				document.getElementById( 'calculator-button-1' ).click();
				break;
			// 2
			case 40:
				document.getElementById( 'calculator-button-2' ).click();
				break;
			// 3
			case 34:
				document.getElementById( 'calculator-button-3' ).click();
				break;
			// 0
			case 45:
				document.getElementById( 'calculator-button-0' ).click();
				break;
			// Escape
			case 27:
				document.getElementById( 'calculator-button-c' ).click();
				break;
			// BACKSPACE
			case 8:
				document.getElementById( 'calculator-button-backspace' ).click();
				break;
			// Divide
			case 111:
				document.getElementById( 'calculator-button-÷' ).click();
				break;
			// Minus
			case 109:
				document.getElementById( 'calculator-button--' ).click();
				break;
			// Plus
			case 107:
				document.getElementById( 'calculator-button-+' ).click();
				break;
			// Multiply
			case 106:
				document.getElementById( 'calculator-button-x' ).click();
				break;
			// DEL
			case 46:
				document.getElementById( 'calculator-button-.' ).click();
				break;
			// ENTER
			case 13:
				document.getElementById( 'calculator-button-=' ).click();
				break;
			default:
				console.log( k );
				break;
			
		}
		return cancelBubble( e );
	}
}

Application.receiveMessage = function( msg )
{
	switch( msg.command )
	{
		case 'focusview':
			window.focus();
			break;
		case 'blurview':
			window.blur();
			break;
	}	
}

