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

use Kigkonsult\Icalcreator\Vcalendar;
use InvalidArgumentException;

use function clearstatcache;
use function file_put_contents;
use function fclose;
use function filesize;
use function filter_var;
use function filemtime;
use function fopen;
use function fpassthru;
use function gzencode;
use function header;
use function is_file;
use function is_readable;
use function sprintf;
use function strcasecmp;
use function strlen;
use function strpos;
use function substr;
use function sys_get_temp_dir;
use function tempnam;
use function time;
use function unlink;
use function utf8_encode;

/**
 * iCalcreator http support class, also rfc2368 support (iCal cal-address)
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.8 - 2019-03-17
 */
class HttpFactory
{
    /**
     * HTTP headers
     *
     * @var array $headers
     * @access private
     * @static
     */
    private static $headers = [
        'Content-Encoding: gzip',
        'Vary: *',
        'Content-Length: %s',
        'Content-Type: text/calendar; charset=utf-8',
        'Content-Disposition: attachment; filename="%s"',
        'Content-Disposition: inline; filename="%s"',
        'Cache-Control: max-age=10',
    ];

    /**
     * Return created, updated and/or parsed calendar, sending a HTTP redirect header.
     *
     * @param Vcalendar $calendar
     * @param bool      $utf8Encode
     * @param bool      $gzip
     * @param bool      $cdType true : Content-Disposition: attachment... (default), false : ...inline...
     * @return bool true on success, false on error
     * @static
     */
    public static function returnCalendar(
        Vcalendar $calendar,
        $utf8Encode = false,
        $gzip       = false,
        $cdType     = true
    ) {
        static $ICR = 'iCr';
        $filename = $calendar->getConfig( Vcalendar::FILENAME );
        $output   = $calendar->createCalendar();
        if( $utf8Encode ) {
            $output = utf8_encode( $output );
        }
        $fsize = null;
        if( $gzip ) {
            $output = gzencode( $output, 9 );
            $fsize  = strlen( $output );
            header( self::$headers[0] );
            header( self::$headers[1] );
        }
        else {
            if( false !== ( $temp = tempnam( sys_get_temp_dir(), $ICR ))) {
                if( false !== file_put_contents( $temp, $output )) {
                    $fsize = @filesize( $temp );
                }
                unlink( $temp );
            }
        }
        if( ! empty( $fsize )) {
            header( sprintf( self::$headers[2], $fsize ));
        }
        header( self::$headers[3] );
        $cdType = ( $cdType ) ? 4 : 5;
        header( sprintf( self::$headers[$cdType], $filename ));
        header( self::$headers[6] );
        echo $output;
        return true;
    }

    /**
     * If recent version of calendar file exists (default one hour), an HTTP redirect header is sent
     *
     * @param Vcalendar $calendar
     * @param int       $timeout default 3600 sec
     * @param bool      $cdType  true : Content-Disposition: attachment... (default), false : ...inline...
     * @return bool true on success, false on error
     * @static
     */
    public static function useCachedCalendar(
        Vcalendar $calendar,
        $timeout = 3600,
        $cdType  = true
    ) {
        static $R = 'r';
        if( false === ( $dirfile = $calendar->getConfig( Vcalendar::URL ))) {
            $dirfile = $calendar->getConfig( Vcalendar::DIRFILE );
        }
        if( ! is_file( $dirfile ) || ! is_readable( $dirfile )) {
            return false;
        }
        if( time() - filemtime( $dirfile ) > $timeout ) {
            return false;
        }
        clearstatcache();
        $fsize    = @filesize( $dirfile );
        $filename = $calendar->getConfig( Vcalendar::FILENAME );
        header( self::$headers[3] );
        if( ! empty( $fsize )) {
            header( sprintf( self::$headers[2], $fsize ));
        }
        $cdType = ( $cdType ) ? 4 : 5;
        header( sprintf( self::$headers[$cdType], $filename ));
        header( self::$headers[6] );
        if( false === ( $fp = @fopen( $dirfile, $R ))) {
            return false;
        }
        fpassthru( $fp );
        fclose( $fp );
        return true;
    }

    /**
     * Assert URL
     *
     * @param string $url
     * @throws InvalidArgumentException
     * @static
     * @since  2.27.3 - 2018-12-28
     */
    public static function assertUrl( $url ) {
        static $UC   = '_';
        static $URN  = 'urn';
        static $HTTP = 'http://';
        static $MSG  = 'Validity error #%d for URL value \'%s\'';
        $url2 = ( false !== strpos( $url, $UC )) ? str_replace( $UC, Util::$MINUS, $url ) : $url;
        $no   = 0;
        do {
            if( false !== filter_var( $url2, FILTER_VALIDATE_URL )) {
                break;
            }
            if( empty( parse_url( $url2, PHP_URL_SCHEME)) &&
                ( false !== filter_var( $HTTP . $url2, FILTER_VALIDATE_URL ))) {
                break;
            }
            $no = 1;
            if( 0 != strcasecmp( $URN, substr( $url, 0, 3 ))) {
                $no = 2;
            }
            break;
        } while( true );
        if( ! empty( $no )) {
            throw new InvalidArgumentException( sprintf( $MSG, $no, $url ));
        }
    }


}
