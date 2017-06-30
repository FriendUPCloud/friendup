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

