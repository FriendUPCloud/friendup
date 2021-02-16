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

use DateTime;
use Exception;
use InvalidArgumentException;
use Kigkonsult\Icalcreator\Vcalendar;

use function checkdate;
use function count;
use function ctype_digit;
use function date_default_timezone_get;
use function explode;
use function gmdate;
use function in_array;
use function is_array;
use function is_null;
use function is_string;
use function sprintf;
use function str_replace;
use function strcasecmp;
use function strlen;
use function strrpos;
use function strtotime;
use function substr;
use function substr_count;
use function time;
use function trim;
use function var_export;

/**
 * iCalcreator DateTime support class
 *
 * @see https://en.wikipedia.org/wiki/Iso8601
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.8 - 2019-01-12
 */
class DateTimeFactory
{

    /**
     * @var array
     * @static
     */
    public static $DEFAULTVALUEDATETIME = [ Vcalendar::VALUE => Vcalendar::DATE_TIME ];

    /**
     * @var string
     * @static
     */
    public static $YMDHIS       = 'Y-m-d H:i:s';
    public static $YMDHISe      = 'Y-m-d H:i:s e';
    public static $YMDHIS3      = 'Y-m-d-H-i-s';
    public static $YMDHISe3     = 'Y-m-d-H-i-s-e';
    public static $FMTTIMESTAMP = '@%s';

    /**
     * @var string
     * @access private
     * @static
     */
    private static $ERR1        = 'Invalid date : %s';
    private static $ERR3        = 'Can\'t update date with timezone : %s';
    private static $ERR4        = 'Invalid date \'%s\' - \'%s\'';

    /**
     * Return new DateTime object instance
     *
     * @param string $dateTimeString
     * @param string $timeZoneString
     * @return DateTime
     * @throws InvalidArgumentException
     * @throws Exception
     * @static
     * @since  2.27.14 - 2019-02-22
     */
    public static function factory( $dateTimeString = 'now', $timeZoneString = null ) {
        if(( '@' == $dateTimeString[0] ) && ctype_digit( substr( $dateTimeString, 1 ))) {
            try {
                $dateTime = new DateTime( $dateTimeString );
                $dateTime->setTimezone( DateTimeZoneFactory::factory( Vcalendar::UTC ));
                if( ! empty( $timeZoneString ) &&
                    ! DateTimeZoneFactory::isUTCtimeZone( $timeZoneString ) &&
                    ( false === $dateTime->setTimezone( DateTimeZoneFactory::factory( $timeZoneString )))) {
                    throw new InvalidArgumentException( sprintf( self::$ERR3, $timeZoneString ));
                }
                return $dateTime;
            }
            catch( InvalidArgumentException $e ) {
                throw $e;
            }
            catch( Exception $e ) {
                throw $e;
            }
        }
        return DateTimeFactory::assertYmdArgsAsDateTimeString( $dateTimeString, $timeZoneString );
    }

    /**
     * Assert DateTime String
     *
     * @param string $dateTimeString
     * @param string $timeZoneString
     * @return DateTime
     * @throws InvalidArgumentException
     * @static
     * @since  2.27.8 - 2019-01-12
     */
    public static function assertYmdArgsAsDateTimeString( $dateTimeString, $timeZoneString = null ) {
        try {
            $tz = ( empty( $timeZoneString )) ? null : DateTimeZoneFactory::factory( $timeZoneString );
            $dateTime = new DateTime( $dateTimeString, $tz );
        }
        catch( Exception $e ) {
            throw new InvalidArgumentException(
                sprintf( DateTimeFactory::$ERR1, $dateTimeString ),
                null,
                $e );
        }
        return $dateTime;
    }

    /**
     * Return date YMD string
     *
     * @param array  $date
     * @return string
     * @static
     * @since  2.26 - 2018-11-05
     */
    public static function getYMDString( array $date ) {
        static $YMD = '%04d%02d%02d';
        return sprintf( $YMD, (int) $date[Util::$LCYEAR], (int) $date[Util::$LCMONTH], (int) $date[Util::$LCDAY] );
    }

    /**
     * Return date His string
     *
     * @param array  $date
     * @return string
     * @static
     * @since  2.26 - 2018-11-05
     */
    public static function getHisString( array $date ) {
        static $HIS = '%02d%02d%02d';
        return sprintf( $HIS, (int) $date[Util::$LCHOUR], (int) $date[Util::$LCMIN], (int) $date[Util::$LCSEC] );
    }

    /**
     * Return date YMDHISE string
     *
     * @param array  $date
     * @param string $tz
     * @return string
     * @static
     * @since  2.26.7 - 2018-11-27
     */
    public static function getYMDHISEString( array $date, $tz=null ) {
        static $YMDHISE = '%04d-%02d-%02d %02d:%02d:%02d %s';
        if( ! isset( $date[Util::$LCvalue] )) {
            $date = [ Util::$LCvalue => $date ];
        }
        return trim(
            sprintf(
                $YMDHISE,
                (int) $date[Util::$LCvalue][Util::$LCYEAR],
                (int) $date[Util::$LCvalue][Util::$LCMONTH],
                (int) $date[Util::$LCvalue][Util::$LCDAY],
                (int) $date[Util::$LCvalue][Util::$LCHOUR],
                (int) $date[Util::$LCvalue][Util::$LCMIN],
                (int) $date[Util::$LCvalue][Util::$LCSEC],
                $tz
            )
        );
    }

    /**
     * Return ymd-string from timestamp
     *
     * @param int    $timestamp
     * @param string $timezone
     * @return string
     * @throws InvalidArgumentException
     * @static
     * @since  2.27.14 - 2019-02-22
     */
    public static function getYmdFromTimestamp( $timestamp, $timezone = null ) {
        static $YMD = 'Ymd';
        $dateArr = [ Util::$LCTIMESTAMP => $timestamp ];
        if( ! empty( $timezone )) {
            $dateArr[Util::$LCtz] = $timezone;
        }
        $date = DateTimeFactory::getDateTimeFromDateArrayTimestamp( $dateArr );
        return $date->format( $YMD );
    }

    /**
     * Return datestamp for calendar component object instance dtstamp
     *
     * @return array
     * @static
     * @since  2.27.2 - 2018-12-21
     */
    public static function getCurrDateArr() {
        $date = explode( Util::$MINUS, gmdate( DateTimeFactory::$YMDHIS3, time()));
        return [
            Util::$LCYEAR  => $date[0],
            Util::$LCMONTH => $date[1],
            Util::$LCDAY   => $date[2],
            Util::$LCHOUR  => $date[3],
            Util::$LCMIN   => $date[4],
            Util::$LCSEC   => $date[5],
            Util::$LCtz    => Vcalendar::Z,
        ];
    }

    /**
     * Assert valid array date
     *
     * @param array $date
     * @param bool  $isValueDate
     * @throws InvalidArgumentException
     * @static
     * @since  2.27.14 - 2019-02-27
     */
    public static function assertArrayDate( $date, $isValueDate = false ) {
        if( isset( $date[Util::$LCYEAR] )) {
            $tDate    = [ $date[Util::$LCYEAR] ];
            $tDate[1] = isset( $date[Util::$LCMONTH] ) ? $date[Util::$LCMONTH] : -1;
            $tDate[2] = isset( $date[Util::$LCDAY] )   ? $date[Util::$LCDAY]   : -1;
            $tDate[3] = isset( $date[Util::$LCHOUR] )  ? $date[Util::$LCHOUR]  : 0;
            $tDate[4] = isset( $date[Util::$LCMIN] )   ? $date[Util::$LCMIN]   : 0;
            $tDate[5] = isset( $date[Util::$LCSEC] )   ? $date[Util::$LCSEC]   : 0;
            $date     = $tDate;
        }
        if( isset( $date[0] ) &&
            isset( $date[1] ) &&
            isset( $date[2] )) {
            DateTimeFactory::assertYmdArgsAsDate( $date[0], $date[1], $date[2] );
            if( ! $isValueDate &&
                isset( $date[3] )  &&
                isset( $date[4] ) &&
                isset( $date[5] )) {
                DateTimeFactory::assertHisArgsAsTime( $date[3], $date[4], $date[5] );
            }
        }
        else {
            throw new InvalidArgumentException(
                sprintf( DateTimeFactory::$ERR1, var_export( $date, true ))
            );
        }
    }

    /**
     * Assert Ymd-args as date
     *
     * @param int|string $year
     * @param int|string $month
     * @param int|string $day
     * @throws InvalidArgumentException
     * @access private
     * @static
     * @since  2.27.2 - 2019-01-06
     */
    private static function assertYmdArgsAsDate( $year, $month, $day ) {
        if( ! DateTimeFactory::isArgsDate( $year, $month, $day )) {
            throw new InvalidArgumentException(
                sprintf( DateTimeFactory::$ERR1, $year . Util::$MINUS . $month . Util::$MINUS . $day )
            );
        }
    }

    /**
     * Assert valid time
     *
     * @param int|string $hour
     * @param int|string $min
     * @param int|string $sec
     * @throws InvalidArgumentException
     * @acess private
     * @static
     * @since  2.27.14 - 2019-01-26
     */
    private static function assertHisArgsAsTime( $hour, $min, $sec ) {
        static $ERR = 'Invalid time : %s:%s:%s';
        if( is_scalar( $hour ) && is_scalar( $min ) && is_scalar( $sec ) &&
            ctype_digit((string) $hour ) && ctype_digit((string) $min ) && ctype_digit((string) $sec ) &&
            ( 0 <= $hour ) && ( 24 > $hour ) &&
            ( 0 <= $min )  && ( 60 > $min ) &&
            ( 0 <= $sec )  && ( 60 > $sec )) {
            return;
        }
        throw new InvalidArgumentException(
            sprintf(
                $ERR,
                var_export( $hour, true ),
                var_export( $min,  true ),
                var_export( $sec,  true )
            )
        );
    }

    /**
     * Return bool true id args is a valid date
     *
     * @param int|string $year
     * @param int|string $month
     * @param int|string $day
     * @return bool
     * @static
     * @since  2.27.2 - 2019-01-15
     */
    public static function isArgsDate( $year, $month, $day ) {
        return ( is_scalar( $year ) && is_scalar( $month ) && is_scalar( $day ) &&
            ctype_digit((string) $year ) && ctype_digit((string) $month ) && ctype_digit((string) $day ) &&
            ( false !== checkdate( intval( $month ), intval( $day ), intval( $year ))));
    }

    /**
     * Return true if a date (array) has NO date parts
     *
     * @param array $content
     * @return bool
     * @static
     * @since  2.27.14 - 2019-01-26
     */
    public static function hasNoDate( array $content = null ) {
        if( empty( $content ) || ! is_array( $content ) ||
          ! isset( $content[Util::$LCvalue] ) ||
            empty( $content[Util::$LCvalue] )) {
            return true;
        }
        if( isset( $content[Util::$LCvalue][Util::$LCYEAR] ) &&
            isset( $content[Util::$LCvalue][Util::$LCMONTH] ) &&
            isset( $content[Util::$LCvalue][Util::$LCDAY] )) {
            return false;
        }
        return true;
    }

    /**
     * Return internal date (format) with parameters based on input date
     *
     * @param mixed  $value
     * @param array  $params
     * @param bool   $forceUTC
     * @param bool   $localTime
     * @return array
     * @throws InvalidArgumentException
     * @static
     * @since  2.27.14 - 2019-02-26
     */
    public static function setDate(
        $value,
        $params    = [],
        $forceUTC  = false,
        $localTime = false
    ) {
        static $HisKeys    = null;
        if( empty( $HisKeys )) {
            $HisKeys = [ Util::$LCHOUR, Util::$LCMIN, Util::$LCSEC, Util::$LCtz ];
        }
        $output      = [ Util::$LCparams => $params ];
        $isValueDate = ParameterFactory::isParamsValueSet( $output, Vcalendar::DATE );
        $paramTZid   = ParameterFactory::getParamTzid( $output );
        if( ! empty( $paramTZid )) {
            if( DateTimeZoneFactory::hasOffset( $paramTZid ) ) {
                $paramTZid = DateTimeZoneFactory::getTimeZoneNameFromOffset( $paramTZid );
            }
            else {
                DateTimeZoneFactory::assertDateTimeZone( $paramTZid );
            }
        }
        if( $localTime ) {
            $forceUTC  = $isValueDate = false;
        }
        $noInputTz   = false;
        switch( true ) {
            case ( $value instanceof DateTime ) :
                $dateTime = ( DateTimeFactory::dateTimeHasOffset( $value ))
                    ? DateTimeFactory::setDateTimeTimeZone( $value, $value->getTimezone()->getName())
                    : $value;
                if( ! $forceUTC && ! empty( $paramTZid )) {
                    $dateTime = DateTimeFactory::setDateTimeTimeZone( $dateTime, $paramTZid );
                }
                break;
            case ( DateTimeFactory::isArrayTimestampDate( $value )) :
                $dateTime = DateTimeFactory::getDateTimeFromDateArrayTimestamp( $value );
                if( ! $forceUTC && ! empty( $paramTZid )) {
                    $dateTime = DateTimeFactory::setDateTimeTimeZone( $dateTime, $paramTZid );
                }
                break;
            case ( DateTimeFactory::isArrayDate( $value )) :
                $value = DateTimeFactory::dateArrayToStr( $value, $isValueDate, true );
            // fall through
            case ( DateTimeFactory::isStringAndDate( $value )) :
                // string ex. "2006-08-03 10:12:18 [[[+/-]1234[56]] / timezone]"
                list( $dateStr, $timezonePart ) = DateTimeFactory::splitIntoDateStrAndTimezone( $value );
                $noInputTz = ( empty( $timezonePart ) && empty( $paramTZid ));
                $dateTime  = self::getDateTimeWithTimezoneFromString(
                    $dateStr,
                    $localTime ? null : $timezonePart,
                    $localTime ? Vcalendar::UTC : $paramTZid,
                    $forceUTC
                );
                break;
            default :
                throw new InvalidArgumentException(
                    sprintf(
                        self::$ERR4,
                        var_export( $value, true ),
                        var_export( $params, true )
                    )
                );
        } // end switch
        if( ! $isValueDate && $forceUTC ) {
            $dateTime = DateTimeFactory::setDateTimeTimeZone( $dateTime, Vcalendar::UTC );
        }
        $output[Util::$LCvalue] = DateTimeFactory::getDateArrayFromDateTime(
            $dateTime,
            $isValueDate,
            $localTime
        );
        if( $isValueDate ) {
            foreach( $HisKeys as $k ) {
                unset( $output[Util::$LCvalue][$k] );
            }
            $output[Util::$LCvalue] = array_filter( $output[Util::$LCvalue] );
            ParameterFactory::existRem( $output[Util::$LCparams], Vcalendar::TZID );
        }
        else {
            ParameterFactory::existRem( // remove default
                $output[Util::$LCparams],
                Vcalendar::VALUE,
                Vcalendar::DATE_TIME
            );
        }
        if( ! $forceUTC && ( $localTime || $noInputTz )) {
            ParameterFactory::existRem( $output[Util::$LCvalue], Util::$LCtz );
            ParameterFactory::existRem( $output[Util::$LCparams], Vcalendar::TZID );
        }
        elseif( Util::issetAndNotEmpty( $output[Util::$LCvalue], Util::$LCtz )) {
            if( DateTimeZoneFactory::isUTCtimeZone( $output[Util::$LCvalue][Util::$LCtz] )) {
                $output[Util::$LCvalue][Util::$LCtz] = DateTimeZoneFactory::$UTCARR[0];
                ParameterFactory::existRem( $output[Util::$LCparams], Vcalendar::TZID );
            }
            else {
                $output[Util::$LCparams][Vcalendar::TZID] = $output[Util::$LCvalue][Util::$LCtz];
                ParameterFactory::existRem( $output[Util::$LCvalue], Util::$LCtz );
            }
        }
        return $output;
    }

    /**
     * Return array [<datePart>, <timezonePart>] from (split) string
     *
     * @param string $string
     * @return array  [<datePart>, <timezonePart>]
     * @static
     * @since  2.27.14 - 2019-03-08
     * @todo to DateTimeFactory
     */
    public static function splitIntoDateStrAndTimezone( $string ) {
        $string = trim((string) $string );
        if(( DateTimeZoneFactory::$UTCARR[0] == substr( $string, -1 )) &&
            ( ctype_digit( substr( $string, -3, 2 )))) { // nnZ
            return [ substr( $string, 0, -1 ), DateTimeZoneFactory::$UTCARR[1] ]; // UTC
        }
        $strLen = strlen( $string );
        if( DateTimeFactory::isDateTimeStrInIcal( $string )) {
            $icalDateTimeString = substr( $string, 0, 15 );
            if(( DateTimeZoneFactory::$UTCARR[0] == substr( $string, 15, 1 )) && ( 16 == $strLen )) {
                return [ $icalDateTimeString, Vcalendar::UTC ]; // 'Z'
            }
            if( 15 == $strLen ) {
                return [ $string, null ];
            }
        }
        elseif( ctype_digit( $string ) && ( 9 > $strLen )) { // ex. YYYYmmdd
            return [ $string, null ];
        }
        if( DateTimeZoneFactory::hasOffset( $string )) {
            $tz      = DateTimeZoneFactory::getOffset( $string );
            $string2 = trim( substr( $string, 0, 0 - strlen( $tz )));
            if( Vcalendar::GMT == substr( $string2, -3 )) {
                $string2 = trim( substr( $string2, 0, -3 ));
            }
            $tz      = DateTimeZoneFactory::getTimeZoneNameFromOffset( $tz );
            return [ $string2, $tz ];
        } // end if
        if( false !== strrpos( $string, Util::$SP1 )) {
            $tz      = StringFactory::after_last( Util::$SP1, $string );
            $string2 = StringFactory::before_last( Util::$SP1, $string );
            if( DateTimeZoneFactory::isUTCtimeZone( $tz )) {
                $tz = Vcalendar::UTC;
            }
            $found = true;
            try {
                DateTimeZoneFactory::assertDateTimeZone( $tz );
            }
            catch( InvalidArgumentException $e ) {
                $found = false;
            }
            if( $found ) {
                return [ $string2, $tz ];
            }
        } // end if
        return [ $string, null ];
    }

    /**
     * Return DateTime with the right timezone set
     *
     * @param string $dateStr
     * @param string $timezonePart
     * @param string $paramTZid
     * @param bool   $forceUTC
     * @return DateTime
     * @throws InvalidArgumentException
     * @static
     * @since  2.27.8 - 2019-01-14
     */
    public static function getDateTimeWithTimezoneFromString(
        $dateStr,
        $timezonePart = null,
        $paramTZid    = null,
        $forceUTC     = false
    ) {
        $tz2 = null;
        switch( true ) {
            case ( empty( $timezonePart ) && ! empty( $paramTZid )) :
                $tz  = $paramTZid;
                break;
            case ( empty( $timezonePart )) :
                $tz  = date_default_timezone_get(); // local time
                break;
            case ( ! empty( $paramTZid )) :
                $tz  = $timezonePart;
                if( ! $forceUTC ) {
                    $tz2 = $paramTZid;
                }
                break;
            default :
                $tz  = $timezonePart;
                break;
        }
        $dateTime = DateTimeFactory::getDateTimeFromDateString( $dateStr, $tz );
        if( ! empty( $tz2 )) {
            $dateTime = DateTimeFactory::setDateTimeTimeZone( $dateTime, $tz2 );
        }
        return $dateTime;
    }

    /**
     * Return argument variables as date string (acceptable by 'date')
     *
     * @param int    $year
     * @param int    $month
     * @param int    $day
     * @param int    $hour
     * @param int    $min
     * @param int    $sec
     * @param string $tz
     * @return string
     * @static
     * @since  2.27.14 - 2019-01-31
     */
    public static function argsToStr(
        $year  = null,
        $month = null,
        $day   = null,
        $hour  = null,
        $min   = null,
        $sec   = null,
        $tz    = null
    ) {
        static $T = 'T';
        $string = DateTimeFactory::getYMDString( [
            Util::$LCYEAR  => $year,
            Util::$LCMONTH => $month,
            Util::$LCDAY   => $day
        ] );
        if( is_scalar( $hour ) && is_scalar( $min ) && is_scalar( $sec )) {
            $string .= $T . DateTimeFactory::getHisString( [
                Util::$LCHOUR => empty( $hour  ) ? 0 : $hour,
                Util::$LCMIN  => empty( $min  )  ? 0 : $min,
                Util::$LCSEC  => empty( $sec  )  ? 0 : $sec
            ] );
        }
        elseif( is_string( $hour ) && is_null( $min ) && is_null( $sec ) && is_null( $tz )) {
            $tz = $hour;
        }
        if( ! empty( $tz ) && is_scalar( $tz )) {
            if( DateTimeZoneFactory::isUTCtimeZone( $tz )) {
                $string .= Util::$SP1 . DateTimeZoneFactory::$UTCARR[1]; // 'UTC'
            }
            elseif( DateTimeZoneFactory::hasOffset( $tz )) {
                $string .= $tz;
            }
            else {
                $string .= Util::$SP1 . $tz;
            }
        }
        return $string;
    }

    /**
     * Return string formatted DateTime, if offset then set timezone UTC
     *
     * @param DateTime $datetime
     * @return string
     * @throws InvalidArgumentException
     * @static
     * @since  2.26.7 - 2018-11-22
     */
    public static function dateTime2Str( $datetime ) {
        if( DateTimeFactory::dateTimeHasOffset( $datetime )) {
            $datetime = DateTimeFactory::setDateTimeTimeZone( $datetime, $datetime->getTimezone()->getName());
        }
        return $datetime->format( DateTimeFactory::$YMDHISe );
    }

    /**
     * Return bool true if datetime har offset timezone
     *
     * @param DateTime $datetime
     * @return bool
     * @static
     * @since  2.27.19 - 2019-04-09
     */
    public static function dateTimeHasOffset( DateTime $datetime ) {
        return DateTimeZoneFactory::hasOffset( $datetime->getTimezone()->getName());
    }

    /**
     * Return bool true if input contains a date/time (in array format)
     *
     * @param string|array $input
     * @return bool
     * @static
     * @since  2.27.14 - 2019-02-03
     */
    public static function isArrayDate( $input ) {
        if( ! is_array( $input ) ||
            ( 3 > count( $input ))) {
            return false;
        }
        $input = array_change_key_case( $input );
        if( isset( $input[Util::$LCWEEK] ) || isset( $input[Util::$LCTIMESTAMP] )) {
            return false;
        }
        if( isset( $input[0] ) && is_scalar( $input[0] ) &&
            isset( $input[1] ) && is_scalar( $input[1] ) &&
            isset( $input[2] ) && is_scalar( $input[2] )) {
            $input[Util::$LCYEAR]  = $input[0];
            $input[Util::$LCMONTH] = $input[1];
            $input[Util::$LCDAY]   = $input[2];
        }
        if( isset( $input[Util::$LCYEAR] ) &&
            isset( $input[Util::$LCMONTH] ) &&
            isset( $input[Util::$LCDAY] )) {
            return checkdate((int) $input[Util::$LCMONTH], (int) $input[Util::$LCDAY], (int) $input[Util::$LCYEAR] );
        }
        return false;
    }

    /**
     * Return bool true if input array contains a (keyed) timestamp date
     *
     * @param string|array $data
     * @return bool
     * @static
     * @since  2.26.7 - 2018-11-23
     */
    public static function isArrayTimestampDate( $data ) {
        if( ! is_array( $data )) {
            return false;
        }
        $data = array_change_key_case( $data );
        return ( isset( $data[Util::$LCTIMESTAMP] ));
    }

    /**
     * Return (internal, keyed) array from string date
     *
     * @param string $date
     * @return array
     * @static
     * @since  2.27.14 - 2019-02-28
     */
    public static function strDate2arr( $date ) {
        static $ET = [ ' ', 't', 'T' ];
        $date = trim( $date );
        $mCnt = substr_count( $date, Util::$MINUS );
        if( 2 <= $mCnt) {
            $wDate = explode( Util::$MINUS, $date, 3 );
            $date  = $wDate[0] . $wDate[1] . $wDate[2];
        }
        if( 2 <= substr_count( $date, Util::$L ))  {
            if( false == strpos( $date, Util::$SP1 )) {
                $wDate    = explode( Util::$SP1, $date, 2 );
                $wDate[0] = str_replace( Util::$L, null, $wDate[0] );
                $date     = $wDate[0] . Util::$SP1 . $wDate[1];
            }
            else {
                $date[0] = str_replace( Util::$L, null, $date[0] );
            }
        }
        $output = [
            Util::$LCYEAR  => (int) substr( $date, 0, 4 ),
            Util::$LCMONTH => (int) substr( $date, 4, 2 ),
            Util::$LCDAY   => (int) substr( $date, 6, 2 ),
        ];
        if( 8 == strlen( $date )) {
            return $output;
        }
        if( in_array( $date[8], $ET )) {
            $date = trim( substr( $date, 9 ));
        }
        else {
            $date = trim( substr( $date, 8 ));
        }
        if( 0 < substr_count( $date, Util::$COLON )) {
            $date = str_replace( Util::$COLON, null, $date );
        }
        switch( true ) {
            case ( 6 > strlen( $date )) :
                if( ! empty( $date )) {
                    $output[Util::$LCtz] = trim( $date );
                    $date = null;
                }
                break;
            case ( ctype_digit( substr( $date, 0, 6 ))) :
                $output[Util::$LCHOUR] = substr( $date, 0, 2 );
                $output[Util::$LCMIN]  = substr( $date, 2, 2 );
                $output[Util::$LCSEC]  = substr( $date, 4, 2 );
                $date = substr( $date, 6 );
                break;
            case ( ctype_digit( substr( $date, 0, 4 ))) :
                $output[Util::$LCHOUR] = substr( $date, 0, 2 );
                $output[Util::$LCMIN]  = substr( $date, 2, 2 );
                $output[Util::$LCSEC]  = 0;
                $date = substr( $date, 4 );
                break;
            default :
                if( ! empty( $date )) {
                    $output[Util::$LCtz] = trim( $date );
                    $date = null;
                }
                break;
        }
        if( ! empty( $date )) {
            $output[Util::$LCtz] = trim( $date );
            if( DateTimeZoneFactory::isUTCtimeZone( $output[Util::$LCtz] )) {
                $output[Util::$LCtz] = DateTimeZoneFactory::$UTCARR[1]; // 'UTC'
            }
        }
        return $output;
    }

    /*
     * Return bool true if date(times) are in sequence
     *
     * @param mixed $first
     * @param mixed $second
     * @param string $propName
     * @return bool
     * @static
     * @throws InvalidArgumentException
     * @since  2.27.14 - 2019-02-03
     */
    public static function assertYmdArgsAsDatesAreInSequence( $first, $second, $propName ) {
        static $ERR  = '%s, dates are not in (asc) order (%s < _%s_)';
        $isValueDate = ParameterFactory::isParamsValueSet( $first, Vcalendar::DATE );
        switch( true ) {
            case ( $first[Util::$LCvalue] instanceof DateTime ) :
                $firstVal = $first[Util::$LCvalue]->getTimestamp();
                break;
            case ( is_array( $first[Util::$LCvalue] )) :
                $dString = DateTimeFactory::dateArrayToStr( $first[Util::$LCvalue], $isValueDate, true );
                list( $dateStr, $timezonePart ) =
                    DateTimeFactory::splitIntoDateStrAndTimezone( $dString );
                $dateTime = DateTimeFactory::getDateTimeWithTimezoneFromString(
                    $dateStr,
                    $timezonePart,
                    ( Util::issetAndNotEmpty( $first[Util::$LCparams], Vcalendar::TZID ))
                        ? $first[Util::$LCparams][Vcalendar::TZID] : null
                );
                $firstVal = $dateTime->getTimestamp();
                break;
            default :
                $firstVal = $first[Util::$LCvalue];
                break;
        }
        switch( true ) {
            case ( $second[Util::$LCvalue] instanceof DateTime ) :
                $secondVal = $second[Util::$LCvalue]->getTimestamp();
                break;
            case ( is_array( $second[Util::$LCvalue] )) :
                $dString = DateTimeFactory::dateArrayToStr( $second[Util::$LCvalue], $isValueDate, true );
                list( $dateStr, $timezonePart ) =
                    DateTimeFactory::splitIntoDateStrAndTimezone( $dString );
                $dateTime = DateTimeFactory::getDateTimeWithTimezoneFromString(
                    $dateStr,
                    $timezonePart,
                    ( Util::issetAndNotEmpty( $second[Util::$LCparams], Vcalendar::TZID ))
                        ? $second[Util::$LCparams][Vcalendar::TZID] : null
                );
                $secondVal = $dateTime->getTimestamp();
                break;
            default :
                $secondVal = $second[Util::$LCvalue];
                break;
        }
        if( $firstVal > $secondVal ) {
            throw new InvalidArgumentException(
                sprintf( $ERR, $propName, var_export( $first, true ), var_export( $secondVal, true )));
        }
    }

    /*
     * Return string date(time) from array date
     *
     * @param array $dtArray
     * @param bool  $isDATE
     * @param bool  $splitUtcTz
     * @return string
     * @throws InvalidArgumentException
     * @static
     * @since  2.27.14 - 2019-01-26
     */
    public static function dateArrayToStr( array $dtArray, $isDATE = false, $splitUtcTz = false ) {
        static $ERR1 = 'Invalid date (#%d) in \'%s\'';
        static $T    = 'T';
        $cntElems = count( $dtArray );
        $dtArray  = array_change_key_case( $dtArray );
        if( isset( $dtArray[0] ) && is_scalar( $dtArray[0] ) &&
            isset( $dtArray[1] ) && is_scalar( $dtArray[1] ) &&
            isset( $dtArray[2] ) && is_scalar( $dtArray[2] )) {
            $dtArray[Util::$LCYEAR]  = $dtArray[0];
            $dtArray[Util::$LCMONTH] = $dtArray[1];
            $dtArray[Util::$LCDAY]   = $dtArray[2];
        }
        if( ! isset( $dtArray[Util::$LCYEAR] )  || ! is_scalar( $dtArray[Util::$LCYEAR] ) ||
            ! isset( $dtArray[Util::$LCMONTH] ) || ! is_scalar( $dtArray[Util::$LCMONTH] ) ||
            ! isset( $dtArray[Util::$LCDAY] )   || ! is_scalar( $dtArray[Util::$LCDAY] )) {
            throw new InvalidArgumentException( sprintf( $ERR1, 1, var_export( $dtArray, true )));
        }
        if( 51 > $dtArray[Util::$LCYEAR] ) {
            $dtArray[Util::$LCYEAR] += 2000;
        }
        elseif( 100 > $dtArray[Util::$LCYEAR] ) {
            $dtArray[Util::$LCYEAR] += 1900;
        }
        if( ! $splitUtcTz ) { // only on input
            DateTimeFactory::assertArrayDate( $dtArray, false );
        }
        $dateStr = DateTimeFactory::getYMDString( $dtArray );
        if( $isDATE || ( 3 == $cntElems )) {
            return $dateStr;
        }
        if( isset( $dtArray[3] ) && is_scalar( $dtArray[3] )) {
            if( isset( $dtArray[4] ) && is_scalar( $dtArray[4] ) &&
                isset( $dtArray[5] ) && is_scalar( $dtArray[5] )) {
                $dtArray[Util::$LCHOUR] = $dtArray[3];
                $dtArray[Util::$LCMIN]  = $dtArray[4];
                $dtArray[Util::$LCSEC]  = $dtArray[5];
            }
            else { // date Y-m-d with timezone
                $dtArray[Util::$LCtz] = $dtArray[3];
            }
        }
        if( isset( $dtArray[Util::$LCHOUR] ) && is_scalar( $dtArray[Util::$LCHOUR] ) &&
            isset( $dtArray[Util::$LCMIN] )  && is_scalar( $dtArray[Util::$LCMIN] )  &&
            isset( $dtArray[Util::$LCSEC] )  && is_scalar( $dtArray[Util::$LCSEC] )) {
            if( ! $splitUtcTz ) { // only on input
                DateTimeFactory::assertHisArgsAsTime(
                    $dtArray[Util::$LCHOUR], $dtArray[Util::$LCMIN], $dtArray[Util::$LCSEC]
                );
            }
            $dateStr .= $T . DateTimeFactory::getHisString( $dtArray );
        }
        if( isset( $dtArray[6] ) && is_scalar( $dtArray[6] )) {
            $dtArray[Util::$LCtz] = $dtArray[6];
        }
        switch( true ) {
            case ( ! Util::issetAndNotEmpty( $dtArray, Util::$LCtz )) :
                break;
            case ( DateTimeZoneFactory::isUTCtimeZone( $dtArray[Util::$LCtz] )) :
                $dateStr .= ( $splitUtcTz ) ? Util::$SP1 . Vcalendar::UTC : DateTimeZoneFactory::$UTCARR[0]; // 'Z'
                break;
            case ( DateTimeZoneFactory::hasOffset( $dtArray[Util::$LCtz] )) :
                $dateStr .= $dtArray[Util::$LCtz];
                break;
            default :
                $dateStr .= Util::$SP1 . $dtArray[Util::$LCtz];
                break;
        } // end switch
        return $dateStr;
    }

    /*
     * Return DateTime from array timestamp date, opt. with other timezone
     *
     * @param array $array
     * @return DateTime
     * @throws InvalidArgumentException
     * @throws Exception
     * @static
     * @since  2.27.8 - 2019-01-11
     */
    public static function getDateTimeFromDateArrayTimestamp( array $array ) {
        $array      = array_change_key_case( $array );
        $dateTime   = DateTimeFactory::factory(
            sprintf( DateTimeFactory::$FMTTIMESTAMP, $array[Util::$LCTIMESTAMP] )
        );
        if( Util::issetAndNotEmpty( $array, Util::$LCtz ) &&
            ! DateTimeZoneFactory::isUTCtimeZone( $array[Util::$LCtz] )) {
            $dateTime = DateTimeFactory::setDateTimeTimeZone( $dateTime, $array[Util::$LCtz] );
        }
        return $dateTime;
    }

    /*
     * Return DateTime from string date, opt. with other timezone
     *
     * @param string $dateString
     * @param string $tz
     * @return DateTime
     * @throws Exception
     * @throws InvalidArgumentException
     * @access private
     * @static
     * @since  2.27.8 - 2019-01-12
     */
    private static function getDateTimeFromDateString( $dateString, $tz = null ) {
        $tz      = trim( $tz );
        switch( true ) {
            case ( empty( $tz )) :
                break;
            case ( DateTimeZoneFactory::isUTCtimeZone( $tz )) :
                $tz = Vcalendar::UTC;
                break;
            case ( DateTimeZoneFactory::hasOffset( $tz )) :
                $tz  = DateTimeZoneFactory::getTimeZoneNameFromOffset( $tz );
                break;
        }
        $dateTime = DateTimeFactory::factory( $dateString, $tz );
        return $dateTime;
    }

    /*
     * Return DateTime modified from (ext) timezone
     *
     * @param DateTime $dateTime
     * @param string   $tz
     * @return DateTime
     * @throws InvalidArgumentException
     * @static
     * @since  2.27.14 - 2019-02-04
     */
    public static function setDateTimeTimeZone( DateTime $dateTime, $tz ) {
        if( empty( $tz )) {
            return $dateTime;
        }
        if( DateTimeZoneFactory::hasOffset( $tz )) {
            $tz = DateTimeZoneFactory::getTimeZoneNameFromOffset( $tz );
        }
        $currTz = $dateTime->getTimezone()->getName();
        if( DateTimeZoneFactory::isUTCtimeZone( $currTz ) && DateTimeZoneFactory::isUTCtimeZone( $tz )) {
            return $dateTime;
        }
        if( 0 == strcasecmp( $currTz, $tz )) { // same
            return $dateTime;
        }
        try {
            $tzt = DateTimeZoneFactory::factory( $tz );
        }
        catch( Exception $e ) {
            throw new InvalidArgumentException(
                sprintf( DateTimeFactory::$ERR4, $dateTime->format( DateTimeFactory::$YMDHISe ), $tz ),
                null,
                $e
            );
        }
        if( false === $dateTime->setTimezone( $tzt )) {
            throw new InvalidArgumentException(
                sprintf( DateTimeFactory::$ERR4, $dateTime->format( DateTimeFactory::$YMDHISe ), $tz )
            );
        }
        return $dateTime;
    }

    /*
     * Return date array from DateTime
     *
     * @param DateTime $dateTime
     * $param bool     $dateOnly
     * $param bool     $hasNoTimezone
     * @return array
     * @static
     * @since  2.27.8 - 2019-01-11
     */
    public static function getDateArrayFromDateTime( DateTime $dateTime, $dateOnly = false, $hasNoTimezone = false ) {
        $tDateString = $dateTime->format( DateTimeFactory::$YMDHISe3 );
        $output      = [];
        foreach( explode( Util::$MINUS, $tDateString ) as $k => $v ) {
            switch( $k ) {
                case 0 :
                    $output[Util::$LCYEAR] = $v;
                    break;
                case 1 :
                    $output[Util::$LCMONTH] = $v;
                    break;
                case 2 :
                    $output[Util::$LCDAY] = $v;
                    if( $dateOnly ) {
                        break 2;
                    }
                    break;
                case 3 :
                    $output[Util::$LCHOUR] = $v;
                    break;
                case 4 :
                    $output[Util::$LCMIN] = $v;
                    break;
                case 5 :
                    $output[Util::$LCSEC] = $v;
                    break;
                case 6 :
                    if( empty( $v )) {
                        break;
                    }
                    if( ! $hasNoTimezone ) {
                        $output[Util::$LCtz] = DateTimeZoneFactory::isUTCtimeZone( $v )
                            ? DateTimeZoneFactory::$UTCARR[0] : $v;
                    }
                    break 2;
            }
        }
        return $output;
    }

    /*
     *  Return bool true if string contains a valid date
     *
     * @param mixed $str
     * @return bool
     * @static
     * @since  2.27.14 - 2019-02-17
     */
    public static function isStringAndDate( $string ) {
        if( ! is_string( $string )) {
            return false;
        }
        $string = trim( $string );
        return (( 8 <= strlen( $string )) &&
            ( false !== strtotime ( $string )));
    }

    /*
     *  Return bool true if dateStr starts with format YYYYmmdd[T/t]HHmmss
     *
     * @param string $dateStr
     * @return bool
     * @static
     * @since  2.27.8 - 2019-01-12
     */
    public static function isDateTimeStrInIcal( $dateStr ) {
        static $Tarr = ['T','t'];
        return (      is_string( $dateStr) &&
            ctype_digit( substr( $dateStr, 0, 8 )) &&
               in_array( substr( $dateStr, 8, 1 ), $Tarr ) &&
            ctype_digit( substr( $dateStr, 9, 6 )));
    }
}

