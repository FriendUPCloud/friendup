<?php
/**
  * iCalcreator, the PHP class package managing iCal (rfc2445/rfc5445) calendar information.
 *
 * copyright (c) 2007-2019 Kjell-Inge Gustafsson, kigkonsult, All rights reserved
 * Link      https://kigkonsult.se
 * Package   iCalcreator
 * Version   2.28
 * License   Subject matter of licence is the software iCalcreator.
 *           The above copyright, link, package and version notices,
 *           this licence notice and the invariant [rfc5545] PRODID result use
 *           as implemented and invoked in iCalcreator shall be included in
 *           all copies or substantial portions of the iCalcreator.
 *
 *           iCalcreator is free software: you can redistribute it and/or modify
 *           it under the terms of the GNU Lesser General Public License as published
 *           by the Free Software Foundation, either version 3 of the License,
 *           or (at your option) any later version.
 *
 *           iCalcreator is distributed in the hope that it will be useful,
 *           but WITHOUT ANY WARRANTY; without even the implied warranty of
 *           MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
 *           GNU Lesser General Public License for more details.
 *
 *           You should have received a copy of the GNU Lesser General Public License
 *           along with iCalcreator. If not, see <https://www.gnu.org/licenses/>.
 *
 * This file is a part of iCalcreator.
*/

namespace Kigkonsult\Icalcreator\Util;

use function bin2hex;
use function count;
use function ctype_digit;
use function explode;
use function floor;
use function in_array;
use function openssl_random_pseudo_bytes;
use function ord;
use function rtrim;
use function sprintf;
use function str_replace;
use function strcasecmp;
use function strlen;
use function strpos;
use function strrev;
use function strtolower;
use function strtoupper;
use function substr;
use function trim;


/**
 * iCalcreator TEXT support class
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.17 - 2019-03-30
 */
class StringFactory
{

    /**
     * Return concatenated calendar rows, one row for each property
     *
     * @param array $rows
     * @return array
     * @static
     * @since  2.27.17 - 2019-03-30
     */
    public static function concatRows( $rows ) {
        static $CHARs = [ ' ', "\t" ];
        $output = [];
        $cnt    = count( $rows );
        for( $i = 0; $i < $cnt; $i++ ) {
            $line = rtrim( $rows[$i], Util::$CRLF );
            $i1 = $i + 1;
            while(( $i < $cnt ) && isset( $rows[$i1] ) && ! empty( $rows[$i1] ) &&
                in_array( $rows[$i1]{0}, $CHARs )) {
                $i += 1;
                $line .= rtrim( substr( $rows[$i], 1 ), Util::$CRLF );
                $i1 = $i + 1;
            }
            $output[] = $line;
        }
        return $output;
    }

    /**
     * Return string with removed ical line folding
     *
     * Remove any line-endings that may include spaces or tabs
     * and convert all line endings (iCal default '\r\n'),
     * takes care of '\r\n', '\r' and '\n' and mixed '\r\n'+'\r', '\r\n'+'\n'
     *
     * @param string $text
     * @return array
     * @static
     * @since  2.27.17 - 2019-03-30
     */
    public static function convEolChar( & $text ) {
        static $BASEDELIM  = null;
        static $BASEDELIMs = null;
        static $EMPTYROW   = null;
        static $FMT        = '%1$s%2$75s%1$s';
        static $CRLFs      = [ "\r\n", "\n\r", "\n", "\r" ];
        static $CRLFexts   = [ "\r\n ", "\r\n\t" ];
        /* fix dummy line separator etc */
        if( empty( $BASEDELIM )) {
            $BASEDELIM  = StringFactory::getRandChars( 16 );
            $BASEDELIMs = $BASEDELIM . $BASEDELIM;
            $EMPTYROW   = sprintf( $FMT, $BASEDELIM, Util::$SP0 );
        }
        /* fix eol chars */
        $text = str_replace( $CRLFs, $BASEDELIM, $text );
        /* fix empty lines */
        $text = str_replace( $BASEDELIMs, $EMPTYROW, $text );
        /* fix line folding */
        $text = str_replace( $BASEDELIM, Util::$CRLF, $text );
        $text = str_replace( $CRLFexts, null, $text );
        /* split in component/property lines */
        return explode( Util::$CRLF, $text );
    }

    /**
     * Return formatted output for calendar component property
     *
     * @param string $label      property name
     * @param string $attributes property attributes
     * @param string $content    property content
     * @return string
     * @static
     * @since  2.22.20 - 2017-01-30
     */
    public static function createElement( $label, $attributes = null, $content = null ) {
        $output = strtoupper( $label );
        if( ! empty( $attributes )) {
            $output .= trim( $attributes );
        }
        $output .= Util::$COLON . trim( $content );
        return StringFactory::size75( $output );
    }

    /**
     * Return property name and value from (string) row
     *
     * @param  string $row
     * @return array
     * @static
     * @since  2.23.8 - 2017-04-16
     */
    public static function getPropName( $row ) {
        static $COLONSEMICARR = [ ':', ';' ];
        $propName = null;
        $cix      = 0;
        $len      = strlen( $row );
        while( $cix < $len ) {
            if( in_array( $row[$cix], $COLONSEMICARR )) {
                break;
            }
            $propName .= $row[$cix];
            $cix++;
        } // end while...
        if( isset( $row[$cix] )) {
            $row = substr( $row, $cix );
        }
        else {
            $propName = StringFactory::trimTrailNL( $propName ); // property without colon and content
            $row      = null;
        }
        return [ $propName, $row ];
    }

    /**
     * Return a random (and unique) sequence of characters
     *
     * @param int $cnt
     * @return string
     * @static
     * @since  2.27.3 - 2018-12-28
     */
    public static function getRandChars( $cnt ) {
        $cnt = (int) floor( $cnt / 2 );
        $x   = 0;
        do {
            $randChars = bin2hex( openssl_random_pseudo_bytes( $cnt, $cStrong ));
            $x         += 1;
        } while( ( 3 > $x ) && ( false == $cStrong ));
        return $randChars;
    }

    /**
     * Return bool true if propName is X-prefixed
     *
     * @param string $propName
     * @return bool
     * @static
     * @since  2.22.23 - 2017-02-17
     */
    public static function isXprefixed( $propName ) {
        static $X_ = 'X-';
        return ( 0 == strcasecmp( $X_, substr( $propName, 0, 2 )));
    }

    /**
     * Return wrapped string with (byte oriented) line breaks at pos 75
     *
     * Lines of text SHOULD NOT be longer than 75 octets, excluding the line
     * break. Long content lines SHOULD be split into a multiple line
     * representations using a line "folding" technique. That is, a long
     * line can be split between any two characters by inserting a CRLF
     * immediately followed by a single linear white space character (i.e.,
     * SPACE, US-ASCII decimal 32 or HTAB, US-ASCII decimal 9). Any sequence
     * of CRLF followed immediately by a single linear white space character
     * is ignored (i.e., removed) when processing the content type.
     *
     * Edited 2007-08-26 by Anders Litzell, anders@litzell.se to fix bug where
     * the reserved expression "\n" in the arg $string could be broken up by the
     * folding of lines, causing ambiguity in the return string.
     *
     * @param string $string
     * @return string
     * @access private
     * @static
     * @link   http://www.cl.cam.ac.uk/~mgk25/unicode.html#utf-8
     * @since  2.22.23 - 2017-03-01
     */
    public static function size75( $string ) {
        static $DBS     = '\\';
        static $LCN     = 'n';
        static $UCN     = 'N';
        static $SPBSLCN = ' \n';
        static $SP1     = ' ';
        $tmp    = $string;
        $string = null;
        $cCnt   = $x = 0;
        while( true ) {
            if( ! isset( $tmp[$x] )) {
                $string .= Util::$CRLF; // loop breakes here
                break;
            }
            elseif( ( 74 <= $cCnt ) &&
                ( $DBS == $tmp[$x] ) &&
                ( ( $LCN == $tmp[$x + 1] ) || ( $UCN == $tmp[$x + 1] ))) {
                $string .= Util::$CRLF . $SPBSLCN; // don't break lines inside '\n'
                $x      += 2;
                if( ! isset( $tmp[$x] )) {
                    $string .= Util::$CRLF;
                    break;              // or here...
                }
                $cCnt = 3;
            }
            elseif( 75 <= $cCnt ) {
                $string .= Util::$CRLF . $SP1;
                $cCnt   = 1;
            }
            $byte   = ord( $tmp[$x] );
            $string .= $tmp[$x];
            switch( true ) {
                case( ( $byte >= 0x20 ) && ( $byte <= 0x7F )) :
                    $cCnt += 1;                    // characters U-00000000 - U-0000007F (same as ASCII)
                    break;                         // add a one byte character
                case( ( $byte & 0xE0 ) == 0xC0 ) : // characters U-00000080 - U-000007FF, mask 110XXXXX
                    if( isset( $tmp[$x + 1] )) {
                        $cCnt   += 1;
                        $string .= $tmp[$x + 1];
                        $x      += 1;              // add a two bytes character
                    }
                    break;
                case( ( $byte & 0xF0 ) == 0xE0 ) : // characters U-00000800 - U-0000FFFF, mask 1110XXXX
                    if( isset( $tmp[$x + 2] )) {
                        $cCnt   += 1;
                        $string .= $tmp[$x + 1] . $tmp[$x + 2];
                        $x      += 2;              // add a three bytes character
                    }
                    break;
                case( ( $byte & 0xF8 ) == 0xF0 ) : // characters U-00010000 - U-001FFFFF, mask 11110XXX
                    if( isset( $tmp[$x + 3] )) {
                        $cCnt   += 1;
                        $string .= $tmp[$x + 1] . $tmp[$x + 2] . $tmp[$x + 3];
                        $x      += 3;              // add a four bytes character
                    }
                    break;
                case( ( $byte & 0xFC ) == 0xF8 ) : // characters U-00200000 - U-03FFFFFF, mask 111110XX
                    if( isset( $tmp[$x + 4] )) {
                        $cCnt   += 1;
                        $string .= $tmp[$x + 1] . $tmp[$x + 2] . $tmp[$x + 3] . $tmp[$x + 4];
                        $x      += 4;              // add a five bytes character
                    }
                    break;
                case( ( $byte & 0xFE ) == 0xFC ) : // characters U-04000000 - U-7FFFFFFF, mask 1111110X
                    if( isset( $tmp[$x + 5] )) {
                        $cCnt   += 1;
                        $string .= $tmp[$x + 1] . $tmp[$x + 2] . $tmp[$x + 3] . $tmp[$x + 4] . $tmp[$x + 5];
                        $x      += 5;              // add a six bytes character
                    }
                    break;
                default:                           // add any other byte without counting up $cCnt
                    break;
            } // end switch( true )
            $x += 1;    // next 'byte' to test
        } // end while( true )
        return $string;
    }

    /**
     * Return property value and attributes
     *
     * @param string $line     property content
     * @return array           [line, [*propAttr]]
     * @static
     * @todo   same as in CalAddressFactory::calAddressCheck() ??
     * @todo   fix 2-5 pos port number
     * @since  2.27.14 - 2019-02-26
     */
    public static function splitContent( $line ) {
        static $CSS    = '://';
        static $EQ     = '=';
        if( Util::$COLON == $line[0] ) {
            return [ substr( $line, 1 ) , [] ];
        }
        $attr          = [];
        $attrix        = -1;
        $WithinQuotes  = false;
        $len           = strlen( $line );
        $cix           = 0;
        while( $cix < $len ) {
            if( ! $WithinQuotes &&
                ( Util::$COLON == $line[$cix] ) &&
                ( $CSS != substr( $line, $cix, 3 )) &&
                ! self::colonIsPrefixedByProtocol( $line, $cix ) &&
                ! self::hasPortNUmber( substr( $line, ( $cix + 1 ), 7 ))) {
                $line = substr( $line, ( $cix + 1 ));
                break;
            }
            if( Util::$QQ == $line[$cix] ) { // '"'
                $WithinQuotes = ! $WithinQuotes;
            }
            if( Util::$SEMIC == $line[$cix] ) { // ';'
                $attrix += 1;
                $attr[$attrix] = null; // initiate
            }
            else {
                $attr[$attrix] .= $line[$cix];
            }
            $cix += 1;
        } // end while...
        /* make attributes in array format */
        $propAttr = [];
        foreach( $attr as $attribute ) {
            $attrSplit = explode( $EQ, $attribute, 2 );
            if( 1 < count( $attrSplit )) {
                $propAttr[$attrSplit[0]] = $attrSplit[1];
            }
        }
        return [ $line, $propAttr ];
    }

    /**
     * Return bool true if colon-pos is prefixed by protocol
     *
     * @see  https://www.iana.org/assignments/uri-schemes/uri-schemes.xhtml overkill !!
     *
     * @param string $line
     * @param int    $cix
     * @return bool
     * @accvess private
     * @static
     * @since  2.27.14 - 2019-02-20
     */
    private static function colonIsPrefixedByProtocol( $line, $cix ) {
        static $MSTZ   = [ 'utc-', 'utc+', 'gmt-', 'gmt+' ];
        static $PROTO3 = [ 'cid:', 'sms:', 'tel:', 'urn:' ]; // 'fax:' removed
        static $PROTO4 = [ 'crid:', 'news:', 'pres:' ];
        static $PROTO5 = [ 'mailto:', 'telnet:' ];
        $line = strtolower( $line );
        return (( in_array( substr( $line, $cix - 6, 4 ), $MSTZ )) || // ?? -6
                ( in_array( substr( $line, $cix - 3, 4 ), $PROTO3 )) ||
                ( in_array( substr( $line, $cix - 4, 5 ), $PROTO4 )) ||
                ( in_array( substr( $line, $cix - 6, 7 ), $PROTO5 )));
    }

    /**
     * Return bool true if leading chars in string is a port number (e.i. followed by '/')
     *
     * @param string $string
     * @return bool
     * @access private
     * @static
     * @since  2.27.14 - 2019-02-20
     */
    private static function hasPortNUmber( $string ) {
        static $SLASH = '/';
        $len = strlen( $string );
        for( $x = 0; $x < $len; $x++ ) {
            if( ! ctype_digit( $string[$x] )) {
                break;
            }
            if( $SLASH == $string[$x] ) {
                return true;
            }
        }
        return false;
    }

    /**
     * Fix rfc5545. 3.3.11 Text, ESCAPED-CHAR
     *
     * @param string $string
     * @return string
     * @static
     * @since  2.27.14 - 2019-02-20
     */
    public static function strrep( $string ) {
        static $BSLCN    = '\n';
        static $SPECCHAR = [ 'n', 'N', 'r', ',', ';' ];
        static $DBS      = '\\'; // "\\";
        static $SQ       = "'";
        static $QBSLCR   = "\r";
        static $QBSLCN   = "\n";
        static $BSUCN    = '\N';
        $string = (string) $string;
        $strLen = strlen( $string );
        $pos    = 0;
        // replace single (solo-)backslash by double ones
        while( $pos < $strLen ) {
            if( false === ( $pos = strpos( $string, $DBS, $pos ))) {
                break;
            }
            if( ! in_array( substr( $string, $pos, 1 ), $SPECCHAR )) {
                $string = substr( $string, 0, $pos ) . $DBS . substr( $string, ( $pos + 1 ));
                $pos += 1;
            }
            $pos += 1;
        }
        // replace double quote by single ones
        if( false !== strpos( $string, Util::$QQ )) {
            $string = str_replace( Util::$QQ, $SQ, $string );
        }
        // replace comma by backslash+comma but skip any previously set of backslash+comma
        // replace semicolon by backslash+semicolon but skip any previously set of backslash+semicolon
        foreach( [ Util::$COMMA, Util::$SEMIC ] as $char ) {
            $offset = 0;
            while( false !== ( $pos = strpos( $string, $char, $offset ))) {
                if( ( 0 < $pos ) && ( $DBS != substr( $string, ( $pos - 1 )))) {
                    $string = substr( $string, 0, $pos ) . $DBS . substr( $string, $pos );
                }
                $offset = $pos + 2;
            }
            $string = str_replace( $DBS . $DBS . $char, $DBS . $char, $string );
        }
        // replace "\r\n" by '\n'
        if( false !== strpos( $string, Util::$CRLF )) {
            $string = str_replace( Util::$CRLF, $BSLCN, $string );
        }
        // or replace "\r" by '\n'
        elseif( false !== strpos( $string, $QBSLCR )) {
            $string = str_replace( $QBSLCR, $BSLCN, $string );
        }
        // or replace '\N' by '\n'
        elseif( false !== strpos( $string, $QBSLCN )) {
            $string = str_replace( $QBSLCN, $BSLCN, $string );
        }
        // replace '\N' by  '\n'
        if( false !== strpos( $string, $BSUCN )) {
            $string = str_replace( $BSUCN, $BSLCN, $string );
        }
        // replace "\r\n" by '\n'
        $string = str_replace( Util::$CRLF, $BSLCN, $string );
        return $string;
    }

    /**
     * Special characters management input
     *
     * @param string $string
     * @return string
     * @static
     * @since  2.22.2 - 2015-06-25
     */
    public static function strunrep( $string ) {
        static $BS4 = '\\\\';
        static $BS2 = '\\';
        static $BSCOMMA = '\,';
        static $BSSEMIC = '\;';
        $string = str_replace( $BS4, $BS2, $string );
        $string = str_replace( $BSCOMMA, Util::$COMMA, $string );
        $string = str_replace( $BSSEMIC, Util::$SEMIC, $string );
        return $string;
    }

    /**
     * Return string with trimmed trailing \n
     *
     * @param string $value
     * @return string
     * @static
     * @since  2.22.23 - 2017-02-17
     */
    public static function trimTrailNL( $value ) {
        static $NL = '\n';
        if( $NL == strtolower( substr( $value, -2 ))) {
            $value = substr( $value, 0, ( strlen( $value ) - 2 ));
        }
        return $value;
    }

    /**
     * @link https://php.net/manual/en/function.substr.php#112707
     */

    /**
     * Return substring after first needle in haystack
     *
     * @link https://php.net/manual/en/function.substr.php#112707
     * @param string $needle
     * @param string $haystack
     * @return string
     * @static
     */
    public static function after( $needle, $haystack ) {
        if( false !== ( $pos = strpos( $haystack, $needle ))) {
            return substr( $haystack, $pos + strlen( $needle ));
        }
        else {
            return '';
        }
    }

    /**
     * Return substring after last needle in haystack
     *
     * @link https://php.net/manual/en/function.substr.php#112707
     * @param string $needle
     * @param string $haystack
     * @return string
     * @static
     */
    public static function after_last( $needle, $haystack ) {
        if( false !== ( $pos = self::strrevpos( $haystack, $needle ))) {
            return substr( $haystack, $pos + strlen( $needle ));
        }
        else {
            return '';
        }
    }

    /**
     * Return substring before first needle in haystack
     *
     * @link https://php.net/manual/en/function.substr.php#112707
     * @param string $needle
     * @param string $haystack
     * @return string
     * @static
     */
    public static function before( $needle, $haystack ) {
        return substr( $haystack, 0, strpos( $haystack, $needle ));
    }

    /**
     * Return substring before last needle in haystack
     *
     * @link https://php.net/manual/en/function.substr.php#112707
     * @param string $needle
     * @param string $haystack
     * @return string
     * @static
     */
    public static function before_last( $needle, $haystack ) {
        return substr( $haystack, 0, self::strrevpos( $haystack, $needle ));
    }

    /**
     * Return substring between first needles in haystack
     *
     * @link https://php.net/manual/en/function.substr.php#112707
     * @param string $needle1
     * @param string $needle2
     * @param string $haystack
     * @return string
     * @static
     */
    public static function between( $needle1, $needle2, $haystack ) {
        return self::before( $needle2, self::after( $needle1, $haystack ));
    }

    /**
     * Return substring between last needles in haystack
     *
     * @link https://php.net/manual/en/function.substr.php#112707
     * @param string $needle1
     * @param string $needle2
     * @param string $haystack
     * @return string
     * @static
     */
    public static function between_last( $needle1, $needle2, $haystack ) {
        return self::after_last( $needle1, self::before_last( $needle2, $haystack));
    }

    /**
     * Return pos for reversed needle in reversed haystack ??
     *
     * @link https://php.net/manual/en/function.substr.php#112707
     * @param string $haystack
     * @param string $needle
     * @return int
     * @static
     */
    public static function strrevpos( $haystack, $needle ) {
        if( false !== ( $rev_pos = strpos( strrev( $haystack ), strrev( $needle )))) {
            return strlen( $haystack ) - $rev_pos - strlen( $needle );
        }
        else {
            return false;
        }
    }

    /**
     * Return bool true if haystack starts with needle
     *
     * @param string $haystack
     * @param string $needle
     * @param string $pos       if true contains lenght of needle
     * @return bool
     * @static
     * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
     */
    public static function startWith( $haystack, $needle, & $pos = null ) {
        $pos       = false;
        $needleLen = strlen( $needle );
        if( $needleLen > strlen( $haystack )) {
            return false;
        }
        if( $needle == substr( $haystack, 0, $needleLen )) {
            $pos = $needleLen;
            return true;
        };
        return false;
    }

}
