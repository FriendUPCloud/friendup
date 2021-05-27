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

use function array_reverse;
use function array_shift;
use function ctype_lower;
use function ctype_upper;
use function explode;
use function gmdate;
use function implode;
use function in_array;
use function sprintf;
use function strlen;
use function strpos;
use function ucfirst;

/**
 * iCalcreator vCard support class
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.8 - 2019-03-18
 */
class IcalvCardFactory
{
    /*
     * $var array
     * @access private
     * @static
     */
    private static $VCARDVERSIONS = [ 2 => '2.1', 3 => '3.0', 4 => '4.0' ];
    /*
        $V2_1 = '2.1';
    private static $V3_0 = '3.0';
    private static $V4_0 = '4.0';
    */

    /**
     * Convert single ATTENDEE, CONTACT or ORGANIZER (in email format) to vCard 2.1, 3,0 or 4.0
     *
     * Returns vCard/true or if directory (if set) or file write is invalid, false
     *
     * @param string $email
     * @param string $version   vCard version (default 2.1)
     * @return string
     * @throws InvalidArgumentException
     * @static
     * @since  2.27.8 - 2019-03-18
     */
    public static function iCal2vCard( $email, $version = null ) {
        static $FMTFN      = "FN:%s\r\n";
        static $FMTEMAIL   = "EMAIL:%s\r\n";
        static $BEGINVCARD = "BEGIN:VCARD\r\n";
        static $FMTVERSION = "VERSION:%s\r\n";
        static $FMTPRODID  = "PRODID:-//kigkonsult.se %s\r\n";
        static $FMTREV     = "REV:%s\r\n";
        static $YMDTHISZ   = 'Ymd\THis\Z';
        static $ENDVCARD   = "END:VCARD\r\n";
        if( empty( $version ) ) {
            $version = self::$VCARDVERSIONS[2];
        }
        else {
            self::assertVcardVersion( $version );
        }
        CalAddressFactory::assertCalAddress( $email );
        /* prepare vCard name */
        $names   = self::splitNameInNameparts( CalAddressFactory::extractNamepartFromEmail( $email ));
        /* create vCard */
        $vCard   = $BEGINVCARD;
        $vCard  .= sprintf( $FMTVERSION, $version );
        $vCard  .= sprintf( $FMTPRODID, ICALCREATOR_VERSION );
        $vCard  .= self::getVcardN( $names, $version );
        $vCard  .= sprintf( $FMTFN, implode( utiL::$SP1, $names ));
        $vCard  .= sprintf( $FMTEMAIL, CalAddressFactory::removeMailtoPrefix( $email ));
        $vCard  .= sprintf( $FMTREV, gmdate( $YMDTHISZ ));
        $vCard  .= $ENDVCARD;
        return $vCard;
    }

    /**
     * Convert ATTENDEEs, CONTACTs and ORGANIZERs (in email format) to vCard 2.1 or 4.0
     *
     * Skips ATTENDEEs, CONTACTs and ORGANIZERs not in email format
     * @param Vcalendar $calendar    iCalcreator Vcalendar instance
     * @param string    $version     vCard version (default 2.1)
     * @param bool      $inclParams  fetch from values or include from parameters
     * @param int       $count       on return, count of hits
     * @return string   vCards
     * @static
     * @since  2.27.8 - 2019-03-17
     */
    public static function iCal2vCards( Vcalendar $calendar, $version = null, $inclParams = true, & $count = null ) {
        $hits   = CalAddressFactory::getCalAddresses( $calendar, null, $inclParams );
        $output = null;
        $count  = 0;
        foreach( $hits as $email ) {
            try {
                $res = self::iCal2vCard( $email, $version );
            }
            catch( InvalidArgumentException $e ) {
                continue;
            }
            $count  += 1;
            $output .= $res;
        }
        return $output;
    }

    /**
     * Assert vCard version
     *
     * @param string $version
     * @throws InvalidArgumentException
     * @access private
     * @static
     * @since  2.27.8 - 2019-03-18
     */
    private static function assertVcardVersion( $version ) {
        static $ERRMSG1 = 'Invalid version %s';
        if( ! in_array( $version, self::$VCARDVERSIONS )) {
            throw new InvalidArgumentException( sprintf( $ERRMSG1, $version ));
        }
    }

    /**
     * Split name in nameParts
     *
     * @param string $name
     * @return array
     * @access private
     * @static
     * @since  2.27.8 - 2019-03-17
     */
    private static function splitNameInNameparts( $name ) {
        switch( true ) {
            case ( ctype_upper( $name ) || ctype_lower( $name )) :
                $nameParts = [ $name ];
                break;
            case ( false !== strpos( $name, Util::$DOT )) :
                $nameParts = explode( Util::$DOT, $name );
                foreach( $nameParts as $k => $part ) {
                    $nameParts[$k] = ucfirst( $part );
                }
                break;
            default : // split camelCase
                $nameParts = [ $name[0] ];
                $k         = 0;
                $x         = 1;
                $len       = strlen( $name );
                while( $x < $len ) {
                    if( ctype_upper( $name[$x] )) {
                        $k += 1;
                        $nameParts[$k] = null;
                    }
                    $nameParts[$k] .= $name[$x];
                    $x++;
                }
                break;
        }
        return $nameParts;
    }

    /**
     * Return formatted vCard name
     *
     * @param array $names
     * @param string $version
     * @return string
     * @access private
     * @static
     * @since  2.27.8 - 2019-03-18
     */
    private static function getVcardN( array $names, $version ) {
        static $FMTN = 'N:%s';
        $name   = array_reverse( $names );
        $vCardN = sprintf( $FMTN, array_shift( $name ));
        $scCnt  = 0;
        while( null != ( $part = array_shift( $name ))) {
            if(( self::$VCARDVERSIONS[4] != $version ) || ( 4 > $scCnt )) {
                $scCnt += 1;
            }
            $vCardN .= Util::$SEMIC . $part;
        }
        while(( self::$VCARDVERSIONS[4] == $version ) && ( 4 > $scCnt )) {
            $vCardN .= Util::$SEMIC;
            $scCnt += 1;
        }
        return $vCardN . Util::$CRLF;
    }

}
