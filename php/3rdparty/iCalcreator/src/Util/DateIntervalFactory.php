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

use DateInterval;
use DateTime;
use Exception;
use InvalidArgumentException;

use function ctype_digit;
use function floor;
use function is_array;
use function is_scalar;
use function strlen;
use function substr;
use function trim;

/**
 * iCalcreator DateInterval utility/support class
 *
 * @see https://en.wikipedia.org/wiki/Iso8601
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.14 - 2019-02-14
 */
class DateIntervalFactory
{
    /**
     * Class constant
     */
    const INTERVAL_ISO8601 = 'P%yY%mM%dDT%hH%iM%sS';

    /**
     * @var string  duration keys etc
     * @access private
     * @static
     */
    private static $Y = 'Y';
    private static $T = 'T';
    private static $W = 'W';
    private static $D = 'D';
    private static $H = 'H';
    private static $M = 'M';
    private static $S = 'S';
    private static $PT0H0M0S = 'PT0H0M0S';
    private static $s = 's';
    private static $i = 'i';
    private static $h = 'h';
    private static $d = 'd';
    private static $m = 'm';
    private static $y = 'y';
    private static $invert = 'invert';

    /**
     * @var string
     * @static
     */
    public static $P         = 'P';

    /**
     * Return new DateTimeZone object instance
     *
     * @param string $dateIntervalString
     * @return DateInterval
     * @throws InvalidArgumentException
     * @static
     * @since  2.27.8 - 2019-01-12
     */
    public static function factory( $dateIntervalString ) {
        return DateIntervalFactory::assertDateIntervalString( $dateIntervalString );
    }

    /**
     * Assert DateIntervalString
     *
     * @param string $dateIntervalString
     * @return DateInterval
     * @throws InvalidArgumentException
     * @static
     * @since  2.27.8 - 2019-01-12
     */
    public static function assertDateIntervalString( $dateIntervalString ) {
        static $ERR = 'Invalid DateInterval \'%s\'';
        try {
            $dateInterval = new DateInterval( $dateIntervalString );
        }
        catch( Exception $e ) {
            throw new InvalidArgumentException( sprintf( $ERR, $dateIntervalString ), null, $e );
        }
        return $dateInterval;
    }

    /**
     * Return bool true is string is a duration
     *
     * @param mixed  $value
     * @return bool
     * @static
     * @since  2.16.7 - 2018-11-26
     */
    public static function isStringAndDuration( $value ) {
        static $PREFIXARR = [ 'P', '+', '-' ];
        if( ! is_string( $value )) {
            return false;
        }
        $value = StringFactory::trimTrailNL( trim( $value ));
        return ( 3 <= strlen( trim( $value ))) && ( in_array( $value{0}, $PREFIXARR ));
    }

    /**
     * Return value with removed opt. prefix +/-
     *
     * @param string  $value
     * @return string
     * @static
     * @since  2.16.7 - 2018-11-26
     * @todo remove -> $isMinus  = ( 0 > $value );  $tz = abs((int) $value );
     */
    public static function removePlusMinusPrefix( $value ) {
        if( DateIntervalFactory::hasPlusMinusPrefix( $value )) {
            $value = substr( $value, 1 );
        }
        return $value;
    }

    /**
     * Return bool true if string has a leading +/-
     *
     * @param string  $value
     * @return bool
     * @static
     * @since  2.16.14 - 2019-02-18
     */
    public static function hasPlusMinusPrefix( $value ) {
        static $PLUSMINUSARR  = [ '+', '-' ];
        return ( in_array( substr( $value, 0, 1 ), $PLUSMINUSARR ));
    }

    /**
     * Return DateInterval as string
     *
     * @param DateInterval $dateInterval
     * @param bool         $showOptSign
     * @return string
     * @static
     * @since  2.16.14 - 2019-02-15
     */
    public static function dateInterval2String( DateInterval $dateInterval, $showOptSign=false ) {
        $dateIntervalArr = (array) $dateInterval;
        $result  = DateIntervalFactory::$P;
        if( empty( $dateIntervalArr[DateIntervalFactory::$y] ) &&
            empty( $dateIntervalArr[DateIntervalFactory::$m] ) &&
            empty( $dateIntervalArr[DateIntervalFactory::$h] ) &&
            empty( $dateIntervalArr[DateIntervalFactory::$i] ) &&
            empty( $dateIntervalArr[DateIntervalFactory::$s] ) &&
          ! empty( $dateIntervalArr[DateIntervalFactory::$d] ) &&
            ( 0 == ( $dateIntervalArr[DateIntervalFactory::$d] % 7 ))) {
            $result .= (int) floor( $dateIntervalArr[DateIntervalFactory::$d] / 7 ) .
                DateIntervalFactory::$W;
            return ( $showOptSign && ( 0 < $dateIntervalArr[DateIntervalFactory::$invert] ))
                ? Util::$MINUS . $result : $result;
        }
        if( 0 < $dateIntervalArr[DateIntervalFactory::$y] ) {
            $result .= $dateIntervalArr[DateIntervalFactory::$y] . DateIntervalFactory::$Y;
        }
        if( 0 < $dateIntervalArr[DateIntervalFactory::$m] ) {
            $result .= $dateIntervalArr[DateIntervalFactory::$m] . DateIntervalFactory::$M;
        }
        if( 0 < $dateIntervalArr[DateIntervalFactory::$d] ) {
            $result .= $dateIntervalArr[DateIntervalFactory::$d] . DateIntervalFactory::$D;
        }
        $hourIsSet = ! empty( $dateIntervalArr[DateIntervalFactory::$h] );
        $minIsSet  = ! empty( $dateIntervalArr[DateIntervalFactory::$i] );
        $secIsSet  = ! empty( $dateIntervalArr[DateIntervalFactory::$s] );
        if( ! $hourIsSet && ! $minIsSet && ! $secIsSet ) {
            if( DateIntervalFactory::$P == $result ) {
                $result = DateIntervalFactory::$PT0H0M0S;
            }
            return ( $showOptSign && ( 0 < $dateIntervalArr[DateIntervalFactory::$invert] ))
                ? Util::$MINUS . $result : $result;
        }
        $result .= DateIntervalFactory::$T;
        if( $hourIsSet ) {
            $result .= $dateIntervalArr[DateIntervalFactory::$h] . DateIntervalFactory::$H;
        }
        if( $minIsSet ) {
            $result .= $dateIntervalArr[DateIntervalFactory::$i] . DateIntervalFactory::$M;
        }
        if( $secIsSet ) {
            $result .= $dateIntervalArr[DateIntervalFactory::$s] . DateIntervalFactory::$S;
        }
        return ( $showOptSign && ( 0 < $dateIntervalArr[DateIntervalFactory::$invert] ))
            ? Util::$MINUS . $result : $result;
    }

    /**
     * Return conformed DateInterval
     *
     * @param DateInterval $dateInterval
     * @return DateInterval
     * @static
     * @throws Exception  on DateInterval create error
     * @since  2.27.14 - 2019-03-09
     */
    public static function conformDateInterval( DateInterval $dateInterval ) {
        $dateIntervalArr = (array) $dateInterval;
        if( 60 <= $dateIntervalArr[DateIntervalFactory::$s] ) {
            $dateIntervalArr[DateIntervalFactory::$i] +=
                (int) floor( $dateIntervalArr[DateIntervalFactory::$s] / 60 );
            $dateIntervalArr[DateIntervalFactory::$s] =
                $dateIntervalArr[DateIntervalFactory::$s] % 60;
        }
        if( 60 <= $dateIntervalArr[DateIntervalFactory::$i] ) {
            $dateIntervalArr[DateIntervalFactory::$h] +=
                (int) floor( $dateIntervalArr[DateIntervalFactory::$i] / 60 );
            $dateIntervalArr[DateIntervalFactory::$i] =
                $dateIntervalArr[DateIntervalFactory::$i] % 60;
        }
        if( 24 <= $dateIntervalArr[DateIntervalFactory::$h] ) {
            $dateIntervalArr[DateIntervalFactory::$d] +=
                (int) floor( $dateIntervalArr[DateIntervalFactory::$h] / 24 );
            $dateIntervalArr[DateIntervalFactory::$h] =
                $dateIntervalArr[DateIntervalFactory::$h] % 24;
        }
        return DateIntervalFactory::DateIntervalArr2DateInterval( $dateIntervalArr );
    }

    /**
     * Modify DateTime from DateInterval
     *
     * @param DateTime     $dateTime
     * @param DateInterval $dateInterval
     * @access private
     * @static
     * @since  2.26.7 - 2018-12-01
     * @tofo error mgnt
     */
    private static function modifyDateTimeFromDateInterval(
        DateTime     $dateTime,
        DateInterval $dateInterval ) {
        // static $FMT = 'Can\'t modify date %s with (%s) %s';
        $dateIntervalArr = (array) $dateInterval;
        $operator = ( 0 < $dateIntervalArr[DateIntervalFactory::$invert] ) ? Util::$MINUS : Util::$PLUS;
        if( 0 < $dateIntervalArr[DateIntervalFactory::$y] ) {
            $dateTime->modify(
                DateIntervalFactory::getModifyString (
                    $operator,
                    $dateIntervalArr[DateIntervalFactory::$y],
                    Util::$LCYEAR
                )
            );
        }
        if( 0 < $dateIntervalArr[DateIntervalFactory::$m] ) {
            $dateTime->modify(
                DateIntervalFactory::getModifyString (
                    $operator,
                    $dateIntervalArr[DateIntervalFactory::$m],
                    Util::$LCMONTH
                )
            );
        }
        if( 0 < $dateIntervalArr[DateIntervalFactory::$d] ) {
            $dateTime->modify(
                DateIntervalFactory::getModifyString (
                    $operator,
                    $dateIntervalArr[DateIntervalFactory::$d],
                    Util::$LCDAY
                )
            );
        }
        if( 0 < $dateIntervalArr[DateIntervalFactory::$h] ) {
            $dateTime->modify(
                DateIntervalFactory::getModifyString (
                    $operator,
                    $dateIntervalArr[DateIntervalFactory::$h],
                    Util::$LCHOUR
                )
            );
        }
        if( 0 < $dateIntervalArr[DateIntervalFactory::$i] ) {
            $dateTime->modify(
                DateIntervalFactory::getModifyString (
                    $operator,
                    $dateIntervalArr[DateIntervalFactory::$i],
                    Util::$LCMIN
                )
            );
        }
        if( 0 < $dateIntervalArr[DateIntervalFactory::$s] ) {
            $dateTime->modify(
                DateIntervalFactory::getModifyString (
                    $operator,
                    $dateIntervalArr[DateIntervalFactory::$s],
                    Util::$LCSEC
                )
            );
        }
    }
    private static function getModifyString ( $operator, $number, $unit ) {
        return $operator . $number . Util::$SP1 . $unit . DateIntervalFactory::getOptPluralSuffix( $number );
    }
    private static function getOptPluralSuffix ( $number ) {
        static $PLS = 's';
        return ( 1 < $number ) ? $PLS : Util::$SP0;
    }
        /**
     * Get DateInterval from (DateInterval) array
     *
     * @param array $dateIntervalArr
     * @return DateInterval
     * @static
     * @throws Exception  on DateInterval create error
     * @since  2.27.2 - 2018-12-21
     */
    public static function DateIntervalArr2DateInterval( $dateIntervalArr ) {
        if( ! is_array( $dateIntervalArr )) {
            $dateIntervalArr = [];
        }
        try {
            $dateInterval = new DateInterval( 'P0D' );
        }
        catch( Exception $e ) {
            throw $e;
        }
        foreach( $dateIntervalArr as $key => $value ) {
            $dateInterval->{$key} = $value;
        }
        return $dateInterval;
    }

    /**
     * Return datetime array (in internal format) for startdate + DateInterval
     *
     * @param array $startDate
     * @param DateInterval $dateInterval
     * @return array, date format
     * @static
     * @since  2.26.14 - 2019-02-04
     */
    public static function dateInterval2date( array $startDate, DateInterval $dateInterval ) {
        static $T   = 'T';
        static $FMT = 'Ymd\THis';
        $dateOnly = (
            isset( $startDate[Util::$LCHOUR] ) ||
            isset( $startDate[Util::$LCMIN] )  ||
            isset( $startDate[Util::$LCSEC] )) ? false : true;
        if( ! isset( $startDate[Util::$LCHOUR] )) {
            $startDate[Util::$LCHOUR] = 0;
        }
        if( ! isset( $startDate[Util::$LCMIN] )) {
            $startDate[Util::$LCMIN] = 0;
        }
        if( ! isset( $startDate[Util::$LCSEC] )) {
            $startDate[Util::$LCSEC] = 0;
        }
        $tz       = ( isset( $startDate[Util::$LCtz] )) ? $startDate[Util::$LCtz] : null;
        $dString  = DateTimeFactory::getYMDString( $startDate ) . $T . DateTimeFactory::getHisString( $startDate );
        $dateTime = DateTime::createFromFormat( $FMT, $dString );
        DateIntervalFactory::modifyDateTimeFromDateInterval( $dateTime, $dateInterval );
        $dateTimeArr = DateTimeFactory::getDateArrayFromDateTime( $dateTime, false, true );
        if( ! empty( $tz )) {
            $dateTimeArr[Util::$LCtz] = $tz;
        }
        if( $dateOnly &&
            (( 0 == $dateTimeArr[Util::$LCHOUR] ) &&
             ( 0 == $dateTimeArr[Util::$LCMIN] ) &&
             ( 0 == $dateTimeArr[Util::$LCSEC] ))) {
            unset(
                $dateTimeArr[Util::$LCHOUR],
                $dateTimeArr[Util::$LCMIN],
                $dateTimeArr[Util::$LCSEC]
            );
        }
        return $dateTimeArr;
    }

    /**
     * Return DateInterval as (external) array
     *
     * @param DateInterval $dateInterval
     * @return array
     * @since  2.27.14 - 2019-03-09
     */
    public static function dateInterval2arr( DateInterval $dateInterval ) {
        $dateIntervalArr = (array) $dateInterval;
        $result = [];
        if( 0 < $dateIntervalArr[DateIntervalFactory::$y] ) {
            $result[Util::$LCYEAR]  = $dateIntervalArr[DateIntervalFactory::$y];
        }
        if( 0 < $dateIntervalArr[DateIntervalFactory::$m] ) {
            $result[Util::$LCMONTH] = $dateIntervalArr[DateIntervalFactory::$m];
        }
        if( 0 < $dateIntervalArr[DateIntervalFactory::$d] ) {
            $result[Util::$LCDAY]   = $dateIntervalArr[DateIntervalFactory::$d];
        }
        if( 0 < $dateIntervalArr[DateIntervalFactory::$h] ) {
            $result[Util::$LCHOUR]  = $dateIntervalArr[DateIntervalFactory::$h];
        }
        if( 0 < $dateIntervalArr[DateIntervalFactory::$i] ) {
            $result[Util::$LCMIN]   = $dateIntervalArr[DateIntervalFactory::$i];
        }
        if( 0 < $dateIntervalArr[DateIntervalFactory::$s] ) {
            $result[Util::$LCSEC]   = $dateIntervalArr[DateIntervalFactory::$s];
        }
        if( empty( $result )) {
            $result[Util::$LCHOUR]  = 0;
            $result[Util::$LCMIN]   = 0;
            $result[Util::$LCSEC]   = 0;
        }
        // separate duration (arr) from datetime (arr)
        $result[Util::$LCWEEK]      = 0;
        return $result;
    }

    /**
     * Return array (in internal format) for a (array) duration
     *
     * For num-array only W+D+HMS
     * @param array $duration
     * @return array
     * @since  2.27.14 - 2019-02-13
     */
    public static function duration2arr( array $duration ) {
        $result = [];
        foreach( $duration as $durKey => $durValue ) {
            if( empty( $durValue )) {
                continue;
            }
            switch( $durKey ) {
                case Util::$LCYEAR:
                    $result[Util::$LCYEAR]  = $durValue;
                    break;
                case Util::$LCMONTH:
                    $result[Util::$LCMONTH] = $durValue;
                    break;
                case Util::$ZERO:
                case Util::$LCWEEK:
                    $result[Util::$LCWEEK]  = $durValue;
                    break;
                case '1':
                case Util::$LCDAY:
                    $result[Util::$LCDAY]   = $durValue;
                    break;
                case '2':
                case Util::$LCHOUR:
                    $result[Util::$LCHOUR]  = $durValue;
                    break;
                case '3':
                case Util::$LCMIN:
                    $result[Util::$LCMIN]   = $durValue;
                    break;
                case '4':
                case Util::$LCSEC:
                    $result[Util::$LCSEC]   = $durValue;
                    break;
            } // end switch
        } // end foreach
        // separate duration (arr) from datetime (arr)
        if( ! Util::issetAndNotEmpty( $result, Util::$LCWEEK )) {
            $result[Util::$LCWEEK] = 0;
        }
        return $result;
    }

    /**
     * Return bool true if (may be) duration array
     *
     * @param string|array $duration
     * @return bool
     * @static
     * @since  2.27.11 - 2019-01-03
     */
    public static function isDurationArray( $duration ) {
        if( ! is_array( $duration )) {
            return false;
        }
        if( DateTimeFactory::isArrayDate( $duration ) ||
            DateTimeFactory::isArrayTimestampDate( $duration ) ||
            isset( $duration[Util::$LCtz] )) {
            return false;
        }
        if( isset( $duration[Util::$LCYEAR] )  ||
            isset( $duration[Util::$LCMONTH] ) ||
            isset( $duration[Util::$LCDAY] )   ||
            isset( $duration[Util::$LCWEEK] )  ||
            isset( $duration[Util::$LCHOUR] )  ||
            isset( $duration[Util::$LCMIN] )   ||
            isset( $duration[Util::$LCSEC] )) {
            return true;
        }
        foreach( $duration as $k => $v ) {
            if( ! is_scalar( $v )) {
                return false;
            }
            if( ! ctype_digit((string) $k ) ||
                ! ctype_digit((string) $v )) {
                return false;
            }
        }
        return true;
    }

    /**
     * Return an iCal formatted string from (internal array) duration
     *
     * @param array $duration , array( year, month, day, week, day, hour, min, sec )
     * @return string
     * @static
     * @since  2.26.14 - 2019-02-12
     */
    public static function durationArray2string( array $duration ) {
        if( ! isset( $duration[Util::$LCYEAR] )  &&
            ! isset( $duration[Util::$LCMONTH] ) &&
            ! isset( $duration[Util::$LCDAY] )   &&
            ! isset( $duration[Util::$LCWEEK] )  &&
            ! isset( $duration[Util::$LCHOUR] )  &&
            ! isset( $duration[Util::$LCMIN] )   &&
            ! isset( $duration[Util::$LCSEC] )) {
            return null;
        }
        if( Util::issetAndNotEmpty( $duration, Util::$LCWEEK )) {
            return DateIntervalFactory::$P . $duration[Util::$LCWEEK] . DateIntervalFactory::$W;
        }
        $result = DateIntervalFactory::$P;
        if( Util::issetAndNotEmpty( $duration, Util::$LCYEAR )) {
            $result .= $duration[Util::$LCYEAR] . DateIntervalFactory::$Y;
        }
        if( Util::issetAndNotEmpty( $duration, Util::$LCMONTH )) {
            $result .= $duration[Util::$LCMONTH] . DateIntervalFactory::$M;
        }
        if( Util::issetAndNotEmpty( $duration, Util::$LCDAY )) {
            $result .= $duration[Util::$LCDAY] . DateIntervalFactory::$D;
        }
        $hourIsSet = ( Util::issetAndNotEmpty( $duration, Util::$LCHOUR ));
        $minIsSet  = ( Util::issetAndNotEmpty( $duration, Util::$LCMIN ));
        $secIsSet  = ( Util::issetAndNotEmpty( $duration, Util::$LCSEC ));
        if( $hourIsSet || $minIsSet || $secIsSet ) {
            $result .= DateIntervalFactory::$T;
        }
        if( $hourIsSet ) {
            $result .= $duration[Util::$LCHOUR] . DateIntervalFactory::$H;
        }
        if( $minIsSet ) {
            $result .= $duration[Util::$LCMIN] . DateIntervalFactory::$M;
        }
        if( $secIsSet ) {
            $result .= $duration[Util::$LCSEC] . DateIntervalFactory::$S;
        }
        if( DateIntervalFactory::$P == $result ) {
            $result = DateIntervalFactory::$PT0H0M0S;
        }
        return $result;
    }

}

