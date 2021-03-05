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

namespace Kigkonsult\Icalcreator\Traits;

use Kigkonsult\Icalcreator\Util\StringFactory;
use Kigkonsult\Icalcreator\Vcalendar;
use Kigkonsult\Icalcreator\Util\Util;
use Kigkonsult\Icalcreator\Util\DateIntervalFactory;
use Kigkonsult\Icalcreator\Util\DateTimeFactory;
use Kigkonsult\Icalcreator\Util\DateTimeZoneFactory;
use Kigkonsult\Icalcreator\Util\ParameterFactory;
use DateTime;
use DateInterval;
use Exception;
use InvalidArgumentException;

use function count;
use function in_array;
use function is_array;
use function is_string;
use function reset;
use function sprintf;
use function usort;
use function var_export;

/**
 * FREEBUSY property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @throws InvalidArgumentException
 * @since 2.27.11 2019-01-03
 */
trait FREEBUSYtrait
{
    /**
     * @var array component property FREEBUSY value
     * @access protected
     */
    protected $freebusy = null;

    /**
     * @var array FREEBUSY param keywords
     * @access protected
     * @static
     */
    protected static $FREEBUSYKEYS = [ self::FREE, self::BUSY, self::BUSY_UNAVAILABLE, self::BUSY_TENTATIVE ];

    /**
     * Return formatted output for calendar component property freebusy
     *
     * @return string
     * @throws Exception
     * @since  2.27.14 - 2019-02-10
     */
    public function createFreebusy() {
        static $FMT = ';FBTYPE=%s';
        static $SORTER = [ 'Kigkonsult\Icalcreator\Util\SortFactory', 'sortRdate1' ];
        if( empty( $this->freebusy )) {
            return null;
        }
        $output = null;
        foreach( $this->freebusy as $fx => $freebusyPart ) {
            if( empty( $freebusyPart[Util::$LCvalue] ) ||
                (( 1 == count( $freebusyPart[Util::$LCvalue] )) &&
                    isset( $freebusyPart[Util::$LCvalue][self::FBTYPE] ))) {
                if( $this->getConfig( self::ALLOWEMPTY )) {
                    $output .= StringFactory::createElement( self::FREEBUSY );
                }
                continue;
            }
            $attributes = $content = null;
            if( isset( $freebusyPart[Util::$LCvalue][self::FBTYPE] )) {
                $attributes .= sprintf( $FMT, $freebusyPart[Util::$LCvalue][self::FBTYPE] );
                unset( $freebusyPart[Util::$LCvalue][self::FBTYPE] );
                $freebusyPart[Util::$LCvalue] = array_values( $freebusyPart[Util::$LCvalue] );
            }
            else {
                $attributes .= sprintf( $FMT, self::BUSY );
            }
            $attributes .= ParameterFactory::createParams( $freebusyPart[Util::$LCparams] );
            $fno        = 1;
            $cnt        = count( $freebusyPart[Util::$LCvalue] );
            if( 1 < $cnt ) {
                usort( $freebusyPart[Util::$LCvalue], $SORTER );
            }
            foreach( $freebusyPart[Util::$LCvalue] as $periodix => $freebusyPeriod ) {
                $content   .= DateTimeFactory::dateArrayToStr( $freebusyPeriod[0] );
                $content   .= Util::$L;
                if( isset( $freebusyPeriod[1]['invert'] )) { // fix pre 7.0.5 bug
                    try {
                        $dateInterval = DateIntervalFactory::DateIntervalArr2DateInterval( $freebusyPeriod[1] );
                    }
                    catch( Exception $e ) {
                        throw $e;
                    }
                        // period=  -> duration
                    $content .= DateIntervalFactory::dateInterval2String( $dateInterval );
                }
                else {  // period=  -> date-time
                    $content .= DateTimeFactory::dateArrayToStr( $freebusyPeriod[1] );
                }
                if( $fno < $cnt ) {
                    $content .= Util::$COMMA;
                }
                $fno++;
            } // end foreach
            $output .= StringFactory::createElement( self::FREEBUSY, $attributes, $content );
        } // end foreach( $this->freebusy as $fx => $freebusyPart )
        return $output;
    }

    /**
     * Delete calendar component property freebusy
     *
     * @param int   $propDelIx   specific property in case of multiply occurrence
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteFreebusy( $propDelIx = null ) {
        if( empty( $this->freebusy )) {
            unset( $this->propDelIx[self::FREEBUSY] );
            return false;
        }
        return $this->deletePropertyM( $this->freebusy, self::FREEBUSY, $propDelIx );
    }

    /**
     * Get calendar component property freebusy
     *
     * @param int    $propIx specific property in case of multiply occurrence
     * @param bool   $inclParam
     * @return bool|array
     * @throws Exception
     * @since  2.27.2 - 2019-01-04
     */
    public function getFreebusy( $propIx = null, $inclParam = false ) {
        if( empty( $this->freebusy )) {
            unset( $this->propIx[self::FREEBUSY] );
            return false;
        }
        $output = $this->getPropertyM( $this->freebusy, self::FREEBUSY, $propIx, $inclParam );
        if( empty( $output )) {
            return false;
        }
        if( empty( $output[Util::$LCvalue] )) {
            return $output;
        }
        if( isset( $output[Util::$LCvalue] )) {
            foreach( $output[Util::$LCvalue] as $perIx => $freebusyPeriod ) {
                if( isset( $freebusyPeriod[1]['invert'] )) { // fix pre 7.0.5 bug
                    try {
                        $dateInterval = DateIntervalFactory::DateIntervalArr2DateInterval( $freebusyPeriod[1] );
                    }
                    catch( Exception $e ) {
                        throw $e;
                    }
                    $output[Util::$LCvalue][$perIx][1] = DateIntervalFactory::dateInterval2arr( $dateInterval );
                    if( isset( $output[Util::$LCvalue][$perIx][1][Util::$LCWEEK] ) &&
                        empty( $output[Util::$LCvalue][$perIx][1][Util::$LCWEEK] )) {
                        unset( $output[Util::$LCvalue][$perIx][1][Util::$LCWEEK] );
                    }
                }
            }
        }
        else {
            foreach( $output as $perIx => $freebusyPeriod ) {
                if( isset( $freebusyPeriod[1]['invert'] )) { // fix pre 7.0.5 bug
                    try {
                        $dateInterval = DateIntervalFactory::DateIntervalArr2DateInterval( $freebusyPeriod[1] );
                    }
                    catch( Exception $e ) {
                        throw $e;
                    }
                    $output[$perIx][1] = DateIntervalFactory::dateInterval2arr( $dateInterval );
                    if( isset( $output[$perIx][1][Util::$LCWEEK] ) &&
                        empty( $output[$perIx][1][Util::$LCWEEK] )) {
                        unset( $output[$perIx][1][Util::$LCWEEK] );
                    }
                }
            }
        }
        return $output;
    }

    /**
     * Return type, value and parameters from parsed row and propAttr
     *
     * @param string $row
     * @param array  $propAttr
     * @return array
     * @since  2.27.11 - 2019-01-04
     */
    protected static function parseFreebusy( $row, array $propAttr ) {
        static $SS = '/';
        $fbtype = $values = null;
        if( ! empty( $propAttr )) {
            foreach( $propAttr as $k => $v ) {
                if( 0 == strcasecmp( self::FBTYPE, $k )) {
                    $fbtype = $v;
                    unset( $propAttr[$k] );
                    break;
                }
            }
        }
        if( ! empty( $row )) {
            $values = explode( Util::$COMMA, $row );
            foreach( $values as $vix => $value ) {
                $value2 = explode( $SS, $value ); // '/'
                if( 1 < count( $value2 )) {
                    $values[$vix] = $value2;
                }
            }
        }
        return [ $fbtype, $values, $propAttr, ];
    }

    /**
     * Set calendar component property freebusy
     *
     * @param string  $fbType
     * @param DateTime|string|array $fbValues
     * @param array   $params
     * @param integer $index
     * @return static
     * @throws Exception
     * @throws InvalidArgumentException
     * @since 2.27.2 2019-02-12
     * @todo Applications MUST treat x-name and iana-token values they don't recognize the same way as they would the BUSY value.
     */
    public function setFreebusy( $fbType = null, $fbValues = null, $params = null, $index = null ) {
        static $ERR1 = 'DateInterval can\'t be first freebusy value';
        static $ERR2 = 'Unknown (%d) freebusy value (#%d/%d) : \'%s\'';
        if( empty( $fbValues )) {
            $this->assertEmptyValue( $fbValues, self::FREEBUSY );
            $this->setMval($this->freebusy, Util::$SP0, [],null, $index );
            return $this;
        }
        $fbType = ( empty( $fbType )) ? self::BUSY : strtoupper( $fbType );
        if( ! in_array( $fbType, self::$FREEBUSYKEYS ) && ! StringFactory::isXprefixed( $fbType )) {
            $fbType = self::BUSY;
        }
        $input    = [ self::FBTYPE => $fbType ];
        $fbValues = self::checkSingleValues( $fbValues );
        foreach( $fbValues as $fbix1 => $fbPeriod ) {     // periods => period
            if( empty( $fbPeriod )) {
                continue;
            }
            $freebusyPeriod = [];
            foreach( $fbPeriod as $fbix2 => $fbMember ) { // pairs => singlepart
                $freebusyPairMember = [];
                switch( true ) {
                    case ( $fbMember instanceof DateTime ) :     // datetime
                        $freebusyPairMember = DateTimeFactory::getDateArrayFromDateTime(
                            DateTimeFactory::setDateTimeTimeZone( $fbMember, Vcalendar::UTC )
                        );
                        break;
                    case ( $fbMember instanceof DateInterval ) : // interval
                        $freebusyPairMember = (array) $fbMember; // fix pre 7.0.5 bug
                        break;
                    case ( is_array( $fbMember )) :
                        switch( true ) {
                            case ( DateTimeFactory::isArrayDate( $fbMember )) :    // date-time value
                                DateTimeFactory::assertArrayDate( $fbMember );
                                $fbMember = DateTimeFactory::dateArrayToStr( $fbMember, false, true );
                                list( $dateStr, $timezonePart ) =
                                    DateTimeFactory::splitIntoDateStrAndTimezone( $fbMember );
                                $dateTime = DateTimeFactory::getDateTimeWithTimezoneFromString(
                                    $dateStr,
                                    ( empty( $timezonePart ) ? Vcalendar::UTC : $timezonePart ),
                                    Vcalendar::UTC,
                                    false
                                );
                                $freebusyPairMember = DateTimeFactory::getDateArrayFromDateTime( $dateTime );
                                break;
                            case ( DateTimeFactory::isArrayTimestampDate( $fbMember )) : // timestamp value
                                $freebusyPairMember = DateTimeFactory::getDateArrayFromDateTime(
                                    DateTimeFactory::setDateTimeTimeZone(
                                        DateTimeFactory::getDateTimeFromDateArrayTimestamp( $fbMember ),
                                        Vcalendar::UTC
                                    )
                                );
                                break;
                            case ( DateIntervalFactory::isDurationArray( $fbMember )) : // array format duration
                                try {  // fix pre 7.0.5 bug
                                    $freebusyPairMember = (array) DateIntervalFactory::conformDateInterval(
                                        new DateInterval(
                                            DateIntervalFactory::durationArray2string(
                                                DateIntervalFactory::duration2arr( $fbMember )
                                            )
                                        )
                                    );
                                }
                                catch( Exception $e ) {
                                    throw $e;
                                }
                                break;
                            default :
                                throw new InvalidArgumentException(
                                    sprintf( $ERR2, 1, $fbix1, $fbix2, var_export( $fbMember, true ))
                                );
                                break;
                        }
                        break;
                    case ( ! is_string( $fbMember )) :
                        throw new InvalidArgumentException(
                            sprintf( $ERR2, 2, $fbix1, $fbix2, var_export( $fbMember, true ))
                        );
                        break;
                    case DateIntervalFactory::isStringAndDuration( $fbMember ) : // duration string
                        $fbMember = DateIntervalFactory::removePlusMinusPrefix( $fbMember ); // can only be positive
                        try {  // fix pre 7.0.5 bug
                            $freebusyPairMember =
                                (array) DateIntervalFactory::conformDateInterval(
                                    DateIntervalFactory::factory( $fbMember )
                                );
                        }
                        catch( Exception $e ) {
                            throw $e;
                        }
                        break;
                    case ( DateTimeFactory::isStringAndDate( trim( $fbMember ))) :   // text date ex. 2006-08-03 10:12:18
                        list( $dateStr, $timezonePart ) = DateTimeFactory::splitIntoDateStrAndTimezone( $fbMember );
                        $dateTime = DateTimeFactory::getDateTimeWithTimezoneFromString(
                            $dateStr,
                            $timezonePart,
                            Vcalendar::UTC,
                            true
                        );
                        if( ! DateTimeZoneFactory::isUTCtimeZone( $dateTime->getTimezone()->getName())) {
                            $dateTime = DateTimeFactory::setDateTimeTimeZone( $dateTime, Vcalendar::UTC );
                        }
                        $freebusyPairMember = DateTimeFactory::getDateArrayFromDateTime( $dateTime );
                        break;
                    default :
                        throw new InvalidArgumentException(
                            sprintf( $ERR2, 3, $fbix1, $fbix2, $fbMember )
                        );
                        break;
                } // end switch
                $freebusyPeriod[] = $freebusyPairMember;
            } // end foreach
            $input[] = $freebusyPeriod;
        }
        $this->setMval( $this->freebusy, $input, $params, null, $index );
        return $this;
    }

    /**
     * Check for single values and , if so, put into array
     *
     * @param array $fbValues
     * @return array
     * @since  2.27.14 - 2019-02-15
     */
    private static function checkSingleValues( array $fbValues ) {
        if( ! is_array( $fbValues )) {
            return $fbValues;
        }
        if( 2 != count( $fbValues )) {
            return $fbValues;
        }
        $first  = reset( $fbValues );
        if( $first instanceof DateTime ) {
            return [ $fbValues ];
        }
        if( DateTimeFactory::isStringAndDate( $first )) {
            return [ $fbValues ];
        }
        if( DateTimeFactory::isArrayDate( $first ) ||
            DateTimeFactory::isArrayTimestampDate( $first )) {
            return [ $fbValues ];
        }
        $second = end( $fbValues );
        if( $second instanceof DateInterval ) {
            return [ $fbValues ];
        }
        if( DateIntervalFactory::isDurationArray( $second )) {
            return [ $fbValues ];
        }
        if( DateIntervalFactory::isStringAndDuration( $second )) {
            return [ $fbValues ];
        }
        return $fbValues;
    }

}
