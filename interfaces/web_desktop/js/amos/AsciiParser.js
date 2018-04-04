//
// AMOS for Friend(s)
// Author : Francois Lionet
// Created on 06/08/2017
//
// Ascii Parser: converts an AMOS Ascii source into Javascript code
//

AsciiParser =  function( app, source )
{
	this.application = app;
	this.source = source;
	this.javascript = "// AMOS for Friend\n// By Francois Lionet\n//\n";
	this.result = ""
	this.tab = 0;
	this.cCount = 0;
	this.lCount = 0;
},
AsciiParser.prototype.parse = function( source )
{
	var lines=this.extractlines( source );
	this.result = "AMOS.run = function()\n"
	this.tab = 0;
	this.lCount = 0;
	this.cCount = 0;
	this.parseBlock( lines );
	this.result += '}\n';
	return this.result;
}
AsciiParser.prototype.parseBlock = function( lines, lStart )
{
	// Add tabulation
	for ( var t = 0; t < this.tab; t++ )
		this.result += '    '; 
	this.result += '{\n';
	this.tab++;
	while( this.lCount < line.length )
	{
		var quit = false;
		var line = lines[ this.lCount ];
		this.cCount = 0;
		while( this.cCount < line.length )
		{
			// Add tabulation
			for ( var t = 0; t < this.tab; t++ )
				this.result += '    '; 
			
			// Next instruction
			var word = this.extractWord( line );
			if ( word == "" )
				break;
			switch ( word )
			{
				case "'":
				case 'rem':
					result += '// ';
					result += line.subString( this.cCount );
					quit = true;
					break;
				case ';':
					break;
				case 'let'
					word = this.extractWord( line );
				default:
					var op = this.extractWord( line );
					if ( op == '=' )
					{
						result += word;
						if ( word.indexOf( '$' ) > 0 )
						{
							word = word.subString( 0, word.length - 1 ) + '_str = ';
							this.parseExpression( line );
						}
						else if ( word.indexOf( '# ' > 0 )
						{
							word = word.subString( 0, word.length - 1 ) + '_dbl = ';
							this.parseExpression( line );
						}
						else
						{
							this.result += word + '_int = Math.floor( '
							this.parseExpression( line );
							this.result += ' );'
						}
					}
					else if ( word == 'procedure' )
					{
						word = this.extractWord( line );
						this.result += 'function ' + word + '()\n';
						this.parseBlock( lines );
						this.result += '};\n'
						quit = true;
					}
					else if ( word == 'end proc')
					{
						quit = true;
					}
					else
					{
						this.result += word + '();'
					}
					break;
			}
			if ( this.error || quit )
				break;
		}
		if ( this.error || quit )
			break;
	}
	this.tab--;
}
/**
 * Extract all the instructions of the source, and returns an 
 * array with one instruction par entry
 * 
 * param: (string) ASCII source
 * return: (array) all the instructions
*/
AsciiParser.extractWord( line )
{
	var result = '';
	for ( count = this.cCount; count < line.length; count++ )
	{
		var c = line.charAt( count );
		
		if ( c == '=' )
	}

	var result = [];
	result[ 0 ] = "";
	var rCount = 0;
	for ( var l = 0; l < source.length; l ++ )
	{
		var count;
		for ( count = 0; count < source.length; count++ )
		{
			c = source.charAt( count );
			if ( c== '"' )
			{
				var count2 = count;
				while ( source.charAt( count2 ) != '"' )
				{
					result[ rCount ] += source.charAt( count2 );
				}
				result[ rCount ] += '"';
			}
			else if ( c == ';' || c == '\n' )
			{
				rCount++;
				result[ rCount ] = "";
				
				// Skips spaces in front
				count = this.skipSpaces( source, count );
			}
			else
			{
				result[ rCount ] = c;
			}
		}
	}
	return result;
}




