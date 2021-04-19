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
use DateTime;
use DateInterval;
use Exception;
use InvalidArgumentException;

use function array_key_exists;
use function array_keys;
use function count;
use function explode;
use function is_array;
use function reset;
use function str_replace;
use function substr;
use function usort;
use function var_export;

/**
 * iCalcreator EXDATE/RDATE support class
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.2 - 2018-12-19
 */
class RexdateFactory
{
    /**
     * @var array
     * @access private
     * @static
     */
    private static $DEFAULTVALUEDATETIME = [ Vcalendar::VALUE => Vcalendar::DATE_TIME ];

    /**
     * @var string
     * @access private
     * @static
     */
    private static $REXDATEERR = 'Unknown %s value (#%d) : %s';

    /**
     * Return formatted output for calendar component property data value type recur
     *
     * @param array $exdateData
     * @param bool  $allowEmpty
     * @return string
     * @static
     */
    public static function formatExdate( $exdateData, $allowEmpty ) {
        static $SORTER1 = [
            'Kigkonsult\Icalcreator\Util\SortFactory',
            'sortExdate1',
        ];
        static $SORTER2 = [
            'Kigkonsult\Icalcreator\Util\SortFactory',
            'sortExdate2',
        ];
        $output  = null;
        $exdates = [];
        foreach(( array_keys( $exdateData )) as $ex ) {
            $theExdate = $exdateData[$ex];
            if( empty( $theExdate[Util::$LCvalue] )) {
                if( $allowEmpty ) {
                    $output .= StringFactory::createElement( Vcalendar::EXDATE );
                }
                continue;
            }
            if( 1 < count( $theExdate[Util::$LCvalue] )) {
                usort( $theExdate[Util::$LCvalue], $SORTER1 );
            }
            $exdates[] = $theExdate;
        }
        if( 1 < count( $exdates )) {
            usort( $exdates, $SORTER2 );
        }
        $isValueDate = ParameterFactory::isParamsValueSet( $exdates, Vcalendar::DATE );
        foreach(( array_keys( $exdates )) as $ex ) {
            $theExdate = $exdates[$ex];
            $content   = $attributes = null;
            foreach(( array_keys( $theExdate[Util::$LCvalue] )) as $eix ) {
                $exdatePart = $theExdate[Util::$LCvalue][$eix];
                $formatted  = DateTimeFactory::dateArrayToStr( $exdatePart, $isValueDate );
                if( isset( $theExdate[Util::$LCparams][Vcalendar::TZID] )) {
                    $formatted = str_replace( Vcalendar::Z, null, $formatted );
                }
                if( 0 < $eix ) {
                    if( isset( $theExdate[Util::$LCvalue][0][Util::$LCtz] )) {
                        if(( DateTimeZoneFactory::hasOffset( $theExdate[Util::$LCvalue][0][Util::$LCtz] )) ||
                            ( Vcalendar::Z == $theExdate[Util::$LCvalue][0][Util::$LCtz] )) {
                            if( Vcalendar::Z != substr( $formatted, -1 )) {
                                $formatted .= Vcalendar::Z;
                            }
                        }
                        else {
                            $formatted = str_replace( Vcalendar::Z, null, $formatted );
                        }
                    }
                    else {
                        $formatted = str_replace( Vcalendar::Z, null, $formatted );
                    }
                } // end if( 0 < $eix )
                $content .= ( 0 < $eix ) ? Util::$COMMA . $formatted : $formatted;
            } // end foreach(( array_keys( $theExdate[Util::$LCvalue]...
            $output .= StringFactory::createElement(
                Vcalendar::EXDATE,
                ParameterFactory::createParams( $theExdate[Util::$LCparams] ),
                $content
            );
        } // end foreach(( array_keys( $exdates...
        return $output;
    }

    /**
     * Return prepared calendar component property exdate input
     *
     * @param array $exdates
     * @param array $params
     * @return mixed array|bool
     * @throws InvalidArgumentException
     * @static
     * @since 2.27.14 - 2019-02-25
     */
    public static function prepInputExdate( $exdates, $params = null ) {
        $output = [
            Util::$LCvalue  => [],
            Util::$LCparams => ParameterFactory::setParams( $params, self::$DEFAULTVALUEDATETIME )
        ];
        ParameterFactory::existRem( // remove default parameter
            $output[Util::$LCparams],
            Vcalendar::VALUE,
            Vcalendar::DATE_TIME
        );
        $isValueDate = ParameterFactory::isParamsValueSet( $output, Vcalendar::DATE );
        $paramTZid   = ParameterFactory::getParamTzid( $output );
        if( ! empty( $paramTZid )) {
            if( DateTimeZoneFactory::hasOffset( $paramTZid )) {
                $paramTZid = DateTimeZoneFactory::getTimeZoneNameFromOffset( $paramTZid );
            }
            else {
                DateTimeZoneFactory::assertDateTimeZone( $paramTZid );
            }
        }
        foreach(( array_keys( $exdates )) as $eix ) {
            $theExdate = $exdates[$eix];
            $wDate     = [];
            switch( true ) {
                case ( $theExdate instanceof DateTime ) :
                    $dateTime = ( DateTimeFactory::dateTimeHasOffset( $theExdate ))
                        ? DateTimeFactory::setDateTimeTimeZone( $theExdate, $theExdate->getTimezone()->getName())
                        : $theExdate;
                    if( ! $isValueDate ) {
                        if( ! empty( $paramTZid )) {
                            $dateTime = DateTimeFactory::setDateTimeTimeZone( $dateTime, $paramTZid );
                        }
                        else {
                            $paramTZid = $dateTime->getTimezone()->getName();
                        }
                    }
                    $wDate = DateTimeFactory::getDateArrayFromDateTime(
                        $dateTime,
                        $isValueDate
                    );
                    break;
                case ( DateTimeFactory::isArrayTimestampDate( $theExdate )) :
                    $dateTime = DateTimeFactory::getDateTimeFromDateArrayTimestamp( $theExdate );
                    if( ! $isValueDate && ! empty( $paramTZid )) {
                        $dateTime = DateTimeFactory::setDateTimeTimeZone( $dateTime, $paramTZid );
                    }
                    elseif( empty( $paramTZid )) {
                        $paramTZid = $dateTime->getTimezone()->getName();
                    }
                    $wDate = DateTimeFactory::getDateArrayFromDateTime(
                        $dateTime,
                        $isValueDate,
                        empty( $paramTZid )
                    );
                    break;
                case ( is_array( $theExdate )) :
                    DateTimeFactory::assertArrayDate( $theExdate, $isValueDate );
                    $theExdate = DateTimeFactory::dateArrayToStr( $theExdate, $isValueDate, true );
                    // fall through
                case ( DateTimeFactory::isStringAndDate( $theExdate )) : // ex. 2006-08-03 10:12:18
                    list( $dateStr, $timezonePart ) = DateTimeFactory::splitIntoDateStrAndTimezone( $theExdate );
                    $dateTime = DateTimeFactory::getDateTimeWithTimezoneFromString(
                        $dateStr,
                        $timezonePart,
                        $paramTZid
                    );
                    $wDate    = DateTimeFactory::getDateArrayFromDateTime(
                        $dateTime,
                        $isValueDate,
                        ( empty( $timezonePart ) && empty( $paramTZid ))
                    );
                    if( Util::issetAndNotEmpty( $wDate, Util::$LCtz )) {
                        list( $wDate, $paramTZid ) = self::manageTzAndTzid( $wDate, $paramTZid );
                    }
                    break;
                default:
                    throw new InvalidArgumentException(
                        sprintf(
                            self::$REXDATEERR,
                            Vcalendar::EXDATE,
                            $eix,
                            var_export( $theExdate, true )
                        )
                    );
                    break;
            } // end switch
            if( $isValueDate ) {
                unset( $wDate[Util::$LCHOUR], $wDate[Util::$LCMIN], $wDate[Util::$LCSEC], $wDate[Util::$LCtz] );
                $wDate = array_filter( $wDate );
            }
            elseif( isset( $wDate[Util::$LCtz] )) {
                $wDate[Util::$LCtz] = (string) $wDate[Util::$LCtz];
            }
            if( ! $isValueDate && ! empty( $paramTZid ) && DateTimeZoneFactory::isUTCtimeZone( $paramTZid )) {
                $wDate[Util::$LCtz] = DateTimeZoneFactory::$UTCARR[0];
            }
            elseif( ! empty( $paramTZid )) {
                unset( $wDate[Util::$LCtz] );
            }
            $output[Util::$LCvalue][] = $wDate;
        } // end foreach(( array_keys( $exdates...
        if( 0 >= count( $output[Util::$LCvalue] )) {
            return false;
        }
        if( $isValueDate ) {
            $output[Util::$LCparams][Vcalendar::VALUE] = Vcalendar::DATE;
            unset( $output[Util::$LCparams][Vcalendar::TZID] );
            $output[Util::$LCvalue] = array_filter( $output[Util::$LCvalue] );
        }
        elseif( ! empty( $paramTZid )) {
            if( DateTimeZoneFactory::isUTCtimeZone( $paramTZid )) {
                unset( $output[Util::$LCparams][Vcalendar::TZID] );
            }
            else {
                $output[Util::$LCparams][Vcalendar::TZID] = $paramTZid;
            }
        }

        $output[Util::$LCparams] = array_filter( $output[Util::$LCparams] );
        return $output;
    }

    /**
     * Return formatted output for calendar component property rdate
     *
     * @param array  $rdateData
     * @param bool   $allowEmpty
     * @param string $compType
     * @return string
     * @static
     * @throws Exception
     * @since  2.27.2 - 2018-12-19
     */
    public static function formatRdate( $rdateData, $allowEmpty, $compType ) {
        static $SORTER1 = [
            'Kigkonsult\Icalcreator\Util\SortFactory',
            'sortRdate1',
        ];
        static $SORTER2 = [
            'Kigkonsult\Icalcreator\Util\SortFactory',
            'sortRdate2',
        ];
        $utcTime = ( Util::isCompInList( $compType, Vcalendar::$TZCOMPS )) ? true : false;
        $output  = null;
        $rDates  = [];
        foreach(( array_keys( $rdateData )) as $rpix ) {
            $theRdate    = $rdateData[$rpix];
            if( empty( $theRdate[Util::$LCvalue] )) {
                if( $allowEmpty ) {
                    $output .= StringFactory::createElement( Vcalendar::RDATE );
                }
                continue;
            }
            if( $utcTime ) {
                unset( $theRdate[Util::$LCparams][Vcalendar::TZID] );
            }
            if( 1 < count( $theRdate[Util::$LCvalue] )) {
                usort( $theRdate[Util::$LCvalue], $SORTER1 );
            }
            $rDates[] = $theRdate;
        }
        if( 1 < count( $rDates )) {
            usort( $rDates, $SORTER2 );
        }
        foreach(( array_keys( $rDates )) as $rpix ) {
            $theRdate    = $rDates[$rpix];
            $paramsTZIDisSet = ! empty( $theRdate[Util::$LCparams][Vcalendar::TZID] );
            $isValueDate = ParameterFactory::isParamsValueSet( $theRdate, Vcalendar::DATE );
            $attributes  = ParameterFactory::createParams( $theRdate[Util::$LCparams] );
            $cnt         = count( $theRdate[Util::$LCvalue] );
            $content     = null;
            $rno         = 1;
            foreach(( array_keys( $theRdate[Util::$LCvalue] )) as $rix ) {
                $rdatePart   = $theRdate[Util::$LCvalue][$rix];
                $contentPart = null;
                if( is_array( $rdatePart ) &&
                    ParameterFactory::isParamsValueSet( $theRdate, Vcalendar::PERIOD )) { // PERIOD
                    if( $utcTime  ||
                        ( $paramsTZIDisSet && isset( $rdatePart[0][Util::$LCtz] ) &&
                            ! DateTimeZoneFactory::hasOffset( $rdatePart[0][Util::$LCtz] ))) {
                        unset( $rdatePart[0][Util::$LCtz] );
                    }
                    $formatted = DateTimeFactory::dateArrayToStr( $rdatePart[0], $isValueDate ); // PERIOD part 1
                    if( $utcTime || $paramsTZIDisSet ) {
                        $formatted = str_replace( Vcalendar::Z, null, $formatted );
                    }
                    $contentPart .= $formatted;
                    $contentPart .= '/';
                    if( isset( $rdatePart[1]['invert'] )) { // fix pre 7.0.5 bug
                        try {
                            $dateInterval = DateIntervalFactory::DateIntervalArr2DateInterval( $rdatePart[1] );
                        }
                        catch( Exception $e ) {
                            throw $e;
                        }
                        $contentPart .= DateIntervalFactory::dateInterval2String( $dateInterval );
                    }
                    elseif( ! array_key_exists( Util::$LCHOUR, $rdatePart[1] )) {
                        $contentPart .= DateTimeFactory::getYMDString( $rdatePart[1] );
                    }
                    else { // date-time
                        if( $utcTime  ||
                            ( $paramsTZIDisSet && isset( $rdatePart[1][Util::$LCtz] ) &&
                                ! DateTimeZoneFactory::hasOffset( $rdatePart[1][Util::$LCtz] ))) {
                            unset( $rdatePart[1][Util::$LCtz] );
                        }
                        $formatted = DateTimeFactory::dateArrayToStr( $rdatePart[1], $isValueDate ); // PERIOD part 2
                        if( $utcTime || $paramsTZIDisSet ) {
                            $formatted = str_replace( Vcalendar::Z, null, $formatted );
                        }
                        $contentPart .= $formatted;
                    }

                } // PERIOD end
                else { // SINGLE date start
                    if( $utcTime  ||
                        ( $paramsTZIDisSet && isset( $rdatePart[Util::$LCtz] ) &&
                            ! DateTimeZoneFactory::hasOffset( $rdatePart[Util::$LCtz] ))) {
                        unset( $rdatePart[Util::$LCtz] );
                    }
                    $formatted = DateTimeFactory::dateArrayToStr( $rdatePart, $isValueDate );
                    if( $utcTime || $paramsTZIDisSet ) {
                        $formatted = str_replace( Vcalendar::Z, null, $formatted );
                    }
                    $contentPart .= $formatted;
                }
                $content .= $contentPart;
                if( $rno < $cnt ) {
                    $content .= Util::$COMMA;
                }
                $rno++;
            } // end foreach(( array_keys( $theRdate[Util::$LCvalue]...
            $output .= StringFactory::createElement( Vcalendar::RDATE, $attributes, $content );
        } // foreach(( array_keys( $rDates...
        return $output;
    }

    /**
     * Return value and parameters from parsed row and propAttr
     *
     * @param string $row
     * @param array $propAttr
     * @return array
     * @since  2.27.11 - 2019-01-04
     */
    public static function parseRexdate( $row, array $propAttr ) {
        static $SS = '/';
        if( empty( $row )) {
            return [ null, $propAttr ];
        }
        $values = explode( Util::$COMMA, $row );
        foreach( $values as $vix => $value ) {
            if( false === strpos( $value, $SS )) {
                continue;
            }
            $value2 = explode( $SS, $value );
            if( 1 < count( $value2 )) {
                $values[$vix] = $value2;
            }
        }
        return [ $values, $propAttr ];
    }

    /**
     * Return prepared calendar component property rdate input
     *
     * @param array  $rDates
     * @param array  $params
     * @param string $compType
     * @return array
     * @throws InvalidArgumentException
     * @throws Exception
     * @static
     * @since 2.27.14 - 2019-02-25
     */
    public static function prepInputRdate( array $rDates, $params=null, $compType=null ) {
        $output    = [ Util::$LCparams => ParameterFactory::setParams( $params, self::$DEFAULTVALUEDATETIME ) ];
        $localTime = ( Util::isCompInList( $compType, Vcalendar::$TZCOMPS ));
        ParameterFactory::existRem( // remove default
            $output[Util::$LCparams],
            Vcalendar::VALUE,
            Vcalendar::DATE_TIME
        );
        $isValuePeriod = ParameterFactory::isParamsValueSet( $output, Vcalendar::PERIOD );
        $isValueDate   = ParameterFactory::isParamsValueSet( $output, Vcalendar::DATE );
        if( $localTime ) {
            $isValuePeriod = $isValueDate = false;
            $paramTZid = Vcalendar::UTC;
        }
        else {
            $paramTZid = ParameterFactory::getParamTzid( $output );
            if( ! empty( $paramTZid )) {
                if( DateTimeZoneFactory::hasOffset( $paramTZid )) {
                    $paramTZid = DateTimeZoneFactory::getTimeZoneNameFromOffset( $paramTZid );
                }
                else {
                    DateTimeZoneFactory::assertDateTimeZone( $paramTZid );
                }
            }
        }
        foreach( $rDates as $rpix => $theRdate ) {
            $wDate = null;
            if( $theRdate instanceof DateTime ) {
                if( ! $isValueDate && empty( $paramTZid )) {
                    $paramTZid = $theRdate->getTimezone()->getName();
                }
                $theRdate = DateTimeFactory::dateTime2Str( $theRdate );
            }
            if( DateTimeFactory::isStringAndDate( $theRdate )) {
                $theRdate = DateTimeFactory::strDate2arr( $theRdate );
            }
            if( is_array( $theRdate )) {
                if( $isValuePeriod ) { // PERIOD
                    list( $wDate, $paramTZid ) = self::getPeriod( $theRdate, $rpix, $paramTZid, $isValueDate );
                } // PERIOD end if, now starts single-date
                elseif( DateTimeFactory::isArrayTimestampDate( $theRdate )) { // timestamp
                    list( $wDate, $paramTZid ) = self::getDateTimeFromTimestamp(
                        $theRdate,
                        $paramTZid,
                        $isValueDate
                    );
                }
                else {                                                // date[-time]
                    DateTimeFactory::assertArrayDate( $theRdate, $isValueDate );
                    list( $wDate, $paramTZid ) = self::getDateTimeFromDateArray( $theRdate, $paramTZid, $isValueDate );
                }
            } // end if( is_array( $theRdate ))
            else {
                throw new InvalidArgumentException(
                    sprintf( self::$REXDATEERR, Vcalendar::RDATE, $rpix, var_export( $theRdate, true ))
                );
            }
            if( ! $isValuePeriod ) {
                if( $isValueDate ) {
                    unset( $wDate[Util::$LCHOUR], $wDate[Util::$LCMIN], $wDate[Util::$LCSEC], $wDate[Util::$LCtz] );
                }
                elseif( isset( $wDate[Util::$LCtz] )) {
                    $wDate[Util::$LCtz] = (string) $wDate[Util::$LCtz];
                }
                $wDate = array_filter( $wDate );
            }
            if( ! $isValueDate && ! empty( $paramTZid ) && DateTimeZoneFactory::isUTCtimeZone( $paramTZid )) {
                if( $isValuePeriod ) { // kolla BÅDA, ej DateInterval
                    $wDate[0][Util::$LCtz] = DateTimeZoneFactory::$UTCARR[0];
                    if( ! isset( $wDate[1]['invert'] )) { // fix pre 7.0.5 bug
                        $wDate[1][Util::$LCtz] = DateTimeZoneFactory::$UTCARR[0];
                    }
                }
                else {
                    $wDate[Util::$LCtz] = DateTimeZoneFactory::$UTCARR[0];
                }
            }
            elseif( ! empty( $paramTZid )) {
                if( $isValuePeriod ) {
                    unset( $wDate[0][Util::$LCtz] );
                    if( ! isset( $wDate[1]['invert'] )) { // fix pre 7.0.5 bug
                        unset( $wDate[1][Util::$LCtz] );
                    }
                }
                else {
                    unset( $wDate[Util::$LCtz] );
                }
            }
            if( $localTime ) {
                unset( $wDate[Util::$LCtz] );
            }
            $output[Util::$LCvalue][] = $wDate;
        } // end foreach( $rDates as $rpix => $theRdate )
        if( $localTime ) {
            unset( $output[Util::$LCparams][Vcalendar::TZID] );
        }
        elseif( $isValueDate ) {
            unset( $output[Util::$LCparams][Vcalendar::TZID] );
        }
        elseif( ! empty( $paramTZid )) {
            if( DateTimeZoneFactory::isUTCtimeZone( $paramTZid )) {
                unset( $output[Util::$LCparams][Vcalendar::TZID] );
            }
            else {
                $output[Util::$LCparams][Vcalendar::TZID] = $paramTZid;
            }
        }
        $output[Util::$LCparams] = array_filter( $output[Util::$LCparams] );
        return $output;
    }

    /**
     * Return managed period (dateTime/dateTime or dateTime/dateInterval)
     *
     * @param array  $period
     * @param int    $rpix
     * @param string $paramTZid
     * @param bool   $isValueDate
     * @return array
     * @throws InvalidArgumentException
     * @throws Exception
     * @access private
     * @static
     * @since  2.27.14 - 2019-02-25
     */
    private static function getPeriod( array $period, $rpix, $paramTZid, $isValueDate ) {
        $wDate = [];
        $perX  = -1;
        foreach( $period as $rix => $rPeriod ) {
            $perX += 1;
            if( $rPeriod instanceof DateTime ) {
                if( ! $isValueDate && empty( $paramTZid )) {
                    $paramTZid = $rPeriod->getTimezone()->getName();
                }
                $rPeriod = DateTimeFactory::dateTime2Str( $rPeriod );
            }
            elseif( $rPeriod instanceof DateInterval ) {
                $wDate[$perX] = (array) $rPeriod; // fix pre 7.0.5 bug
                continue;
            }
            switch( true ) {
                case ( is_array( $rPeriod )) :
                    if( DateTimeFactory::isArrayTimestampDate( $rPeriod )) {    // timestamp
                        list( $wDate[$perX], $paramTZid ) = self::getDateTimeFromTimestamp(
                            $rPeriod,
                            $paramTZid,
                            $isValueDate
                        );
                    }
                    elseif( DateTimeFactory::isArrayDate( $rPeriod )) {
                        list( $wDate[$perX], $paramTZid ) = self::getDateTimeFromDateArray(
                            $rPeriod,
                            $paramTZid,
                            $isValueDate
                        );
                    }
                    elseif(( 1 == count( $rPeriod )) &&
                        DateTimeFactory::isStringAndDate( reset( $rPeriod ))) { // text-date
                        list( $wDate[$perX], $paramTZid ) = self::getDateArrFromDateString(
                            reset( $rPeriod ),
                            $paramTZid,
                            $isValueDate
                        );
                    }
                    elseif( DateIntervalFactory::isDurationArray( $rPeriod )) {  // array format duration
                        try {  // fix pre 7.0.5 bug
                            $wDate[$perX] = (array) DateIntervalFactory::conformDateInterval(
                                new DateInterval(
                                    DateIntervalFactory::durationArray2string(
                                        DateIntervalFactory::duration2arr( $rPeriod )
                                    )
                                )
                            );
                        }
                        catch( Exception $e ) {
                            throw $e;
                        }
                        continue 2;
                    }
                    else {
                        throw new InvalidArgumentException(
                            sprintf(
                                self::$REXDATEERR,
                                Vcalendar::RDATE,
                                $rpix,
                                var_export( $rPeriod, true )
                            )
                        );
                    }
                    break; // END case is_array
                case DateIntervalFactory::isStringAndDuration( $rPeriod ) :  // string format duration
                    if( DateIntervalFactory::$P != $rPeriod[0] ) {
                        $rPeriod = substr( $rPeriod, 1 );
                    }
                    try {
                        $wDate[$perX] =
                            (array) DateIntervalFactory::conformDateInterval( new DateInterval( $rPeriod ));
                    }
                    catch( Exception $e ) {
                        throw $e;
                    }
                    continue 2;
                    break;
                case ( DateTimeFactory::isStringAndDate( $rPeriod )) : // text date ex. 2006-08-03 10:12:18
                    list( $wDate[$perX], $paramTZid ) = self::getDateArrFromDateString(
                        $rPeriod,
                        $paramTZid,
                        $isValueDate
                    );
                    break;
                default :
                    throw new InvalidArgumentException(
                        sprintf(
                            self::$REXDATEERR,
                            Vcalendar::RDATE,
                            $rpix,
                            var_export( $rPeriod, true )
                        )
                    );
                    break;
            } // end switch
            if( $isValueDate ) {
                unset(
                    $wDate[$perX][Util::$LCHOUR],
                    $wDate[$perX][Util::$LCMIN],
                    $wDate[$perX][Util::$LCSEC],
                    $wDate[$perX][Util::$LCtz]
                );
                $wDate[$perX] = array_filter( $wDate );
            }
            elseif( isset( $wDate[$perX][Util::$LCtz] )) {
                $wDate[$perX][Util::$LCtz] = (string) $wDate[$perX][Util::$LCtz];
            }
        } // end foreach( $theRdate as $rix => $rPeriod )
        return [ $wDate, $paramTZid ];
    }

    /**
     * Return dateTime from timestamp
     *
     * @param array  $input
     * @param string $paramTZid
     * @param bool   $isValueDate
     * @return array
     * @access private
     * @static
     * @since  2.27.14 - 2019-02-17
     */
    private static function getDateTimeFromTimestamp( array $input, $paramTZid, $isValueDate ) {
        $dateTime = DateTimeFactory::getDateTimeFromDateArrayTimestamp( $input );
        if( ! $isValueDate && ! empty( $paramTZid )) {
            $dateTime = DateTimeFactory::setDateTimeTimeZone( $dateTime, $paramTZid );
        }
        elseif( empty( $paramTZid )) {
            $paramTZid = $dateTime->getTimezone()->getName();
        }
        $date = DateTimeFactory::getDateArrayFromDateTime(
            $dateTime,
            $isValueDate,
            empty( $paramTZid )
        );
        if( Util::issetAndNotEmpty( $date, Util::$LCtz )) {
            list( $date, $paramTZid ) = self::manageTzAndTzid( $date,$paramTZid );
        }
        return [ $date, $paramTZid ];
    }

    /**
     * Return dateTime from (date) array
     *
     * @param array  $input
     * @param string $paramTZid
     * @param bool   $isValueDate
     * @return array
     * @access private
     * @static
     * @since  2.27.14 - 2019-02-17
     */
    private static function getDateTimeFromDateArray( array $input, $paramTZid, $isValueDate ) {
        $dString = DateTimeFactory::dateArrayToStr( $input, $isValueDate, true );
        list( $dateStr, $timezonePart ) =
            DateTimeFactory::splitIntoDateStrAndTimezone( $dString );
        $dateTime = DateTimeFactory::getDateTimeWithTimezoneFromString(
            $dateStr,
            $timezonePart,
            $paramTZid
        );
        $date = DateTimeFactory::getDateArrayFromDateTime(
            $dateTime,
            $isValueDate,
            ( empty( $timezonePart ) && empty( $paramTZid ))
        );
        if( Util::issetAndNotEmpty( $date, Util::$LCtz )) {
            list( $date, $paramTZid ) = self::manageTzAndTzid( $date,$paramTZid );
        }
        return [ $date, $paramTZid ];
    }

    /**
     * Return dateTime from (date) string
     *
     * @param string $input
     * @param string $paramTZid
     * @param bool   $isValueDate
     * @return array
     * @access private
     * @static
     * @since  2.27.14 - 2019-02-17
     */
    private static function getDateArrFromDateString( $input, $paramTZid, $isValueDate ) {
        list( $dateStr, $timezonePart ) = DateTimeFactory::splitIntoDateStrAndTimezone( $input );
        $dateTime = DateTimeFactory::getDateTimeWithTimezoneFromString(
            $dateStr,
            $timezonePart,
            $paramTZid ?: null
        );
        $date = DateTimeFactory::getDateArrayFromDateTime(
            $dateTime,
            $isValueDate,
            ( empty( $timezonePart ) && empty( $paramTZid ))
        );
        if( Util::issetAndNotEmpty( $date, Util::$LCtz )) {
            list( $date, $paramTZid ) = self::manageTzAndTzid( $date,$paramTZid );
        }
        return [ $date, $paramTZid ];
    }

    /**
     * Check and manage tz and TZID
     *
     * @param array  $date
     * @param string $paramTZid
     * @return array
     * @access private
     * @static
     * @since  2.27.14 - 2019-02-17
     */
    private static function manageTzAndTzid( array $date, $paramTZid ) {
        if( empty( $paramTZid )) {
            if( DateTimeZoneFactory::isUTCtimeZone( $date[Util::$LCtz] )) {
                $date[Util::$LCtz] = DateTimeZoneFactory::$UTCARR[0];
            }
            else {
                $paramTZid = $output[Util::$LCparams][Vcalendar::TZID] = $date[Util::$LCtz];
                unset( $date[Util::$LCtz] );
            }
        }
        elseif( DateTimeZoneFactory::isUTCtimeZone( $paramTZid )) {
            $date[Util::$LCtz] = DateTimeZoneFactory::$UTCARR[0];
        }
        else {
            unset( $date[Util::$LCtz] );
        }
        return [ $date, $paramTZid ];
    }
    
}
