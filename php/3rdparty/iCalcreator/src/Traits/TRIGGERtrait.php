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

use function array_key_exists;
use function is_array;
use function is_null;
use function strtoupper;
use function substr;

/**
 *    rfc5545 : DURATION
 *    Format Definition:  This value type is defined by the following notation:
 *
 *    dur-value  = (["+"] / "-") "P" (dur-date / dur-time / dur-week)
 *
 *    dur-date   = dur-day [dur-time]
 *    dur-time   = "T" (dur-hour / dur-minute / dur-second)
 *    dur-week   = 1*DIGIT "W"
 *    dur-hour   = 1*DIGIT "H" [dur-minute]
 *    dur-minute = 1*DIGIT "M" [dur-second]
 *    dur-second = 1*DIGIT "S"
 *    dur-day    = 1*DIGIT "D"
 */
/**
 * TRIGGER property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since 2.27.14 2019-03-21
 */
trait TRIGGERtrait
{
    /**
     * @var array component property TRIGGER value
     * @access protected
     */
    protected $trigger = null;

    /**
     * @var string  iCal TRIGGER param keywords
     * @static
     * @since  2.26.8 - 2019-03-08
     */
    public static $RELATEDSTART = 'relatedStart';
    public static $BEFORE       = 'before';

    /**
     * Return formatted output for calendar component property trigger
     *
     * @return string
     * @throws Exception
     * @since  2.26.7 - 2018-12-02
     */
    public function createTrigger() {
        static $RELATED_END  = 'RELATED=END';
        if( empty( $this->trigger )) {
            return null;
        }
        if( empty( $this->trigger[Util::$LCvalue] )) {
            return ( $this->getConfig( self::ALLOWEMPTY )) ? StringFactory::createElement( self::TRIGGER ) : null;
        }
        if( isset( $this->trigger[Util::$LCvalue]['invert'] )) { // fix pre 7.0.5 bug
            try {
                $dateInterval = DateIntervalFactory::DateIntervalArr2DateInterval( $this->trigger[Util::$LCvalue] );
            }
            catch( Exception $e ) {
                throw $e;
            }
            return StringFactory::createElement(
                self::TRIGGER,
                ParameterFactory::createParams( $this->trigger[Util::$LCparams] ),
                DateIntervalFactory::dateInterval2String( $dateInterval, true )
            );
        }
        $content = $attributes = null;
        if( isset( $this->trigger[Util::$LCvalue][Util::$LCYEAR] ) &&
            isset( $this->trigger[Util::$LCvalue][Util::$LCMONTH] ) &&
            isset( $this->trigger[Util::$LCvalue][Util::$LCDAY] )) {
            $content .= DateTimeFactory::dateArrayToStr( $this->trigger[Util::$LCvalue] );
        }
        else {
            if( true !== $this->trigger[Util::$LCvalue][self::$RELATEDSTART] ) {
                $attributes .= Util::$SEMIC . $RELATED_END;
            }
            if( $this->trigger[Util::$LCvalue][self::$BEFORE] ) {
                $content .= Util::$MINUS;
            }
            $content .= DateIntervalFactory::durationArray2string( $this->trigger[Util::$LCvalue] );
        }
        $attributes .= ParameterFactory::createParams( $this->trigger[Util::$LCparams] );
        return StringFactory::createElement( self::TRIGGER, $attributes, $content );
    }

    /**
     * Delete calendar component property trigger
     *
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteTrigger() {
        $this->trigger = null;
        return true;
    }

    /**
     * Get calendar component property trigger
     *
     * @param bool   $inclParam
     * @return bool|array
     * @throws Exception
     * @since  2.27.2 - 2018-12-19
     */
    public function getTrigger( $inclParam = false ) {
        if( empty( $this->trigger )) {
            return false;
        }
        if( isset( $this->trigger[Util::$LCvalue]['invert'] )) { // fix pre 7.0.5 bug
            try {
                $dateInterval = DateIntervalFactory::DateIntervalArr2DateInterval( $this->trigger[Util::$LCvalue] );
            }
            catch( Exception $e ) {
                throw $e;
            }
            $value        = DateIntervalFactory::dateInterval2arr( $dateInterval );
            $value[self::$BEFORE]       =
                ( 0 < $this->trigger[Util::$LCvalue]['invert'] ) ? true : false;
            $value[self::$RELATEDSTART] =
                ( ! isset( $this->trigger[Util::$LCparams ][self::RELATED] ) ||
                    ( self::END != $this->trigger[Util::$LCparams ][self::RELATED] ))
                    ? true
                    : false;
        }
        else {
            $value = $this->trigger[Util::$LCvalue];
        }
        if( isset( $value[Util::$LCWEEK] ) && empty( $value[Util::$LCWEEK] )) {
            unset( $value[Util::$LCWEEK] );
        }
        return ( $inclParam )
            ? [ Util::$LCvalue => $value, Util::$LCparams => (array) $this->trigger[Util::$LCparams ] ]
            : $value;
    }

    /**
     * Set calendar component property trigger
     *
     * @param DateTime|DateInterval|array|string|int $value
     * @param int|array $arg2
     * @param int   $arg3
     * @param int   $arg4
     * @param int   $arg5
     * @param int   $arg6
     * @param int|array $arg7
     * @param bool  $relatedStart
     * @param bool  $before
     * @param array $params
     * @return static
     * @throws Exception
     * @throws InvalidArgumentException
     * @since 2.27.14 2019-03-21
     * @todo "If the trigger is set relative to START, then the "DTSTART"
     *        property MUST be present in the associated "VEVENT" or "VTODO"
     *        calendar component.  If an alarm is specified for an event with
     *        the trigger set relative to the END, then the "DTEND" property or
     *        the "DTSTART" and "DURATION " properties MUST be present in the
     *        associated "VEVENT" calendar component.  If the alarm is specified
     *        for a to-do with a trigger set relative to the END, then either
     *        the "DUE" property or the "DTSTART" and "DURATION " properties
     *        MUST be present in the associated "VTODO" calendar component."
     */
    public function setTrigger(
        $value        = null,
        $arg2         = null,
        $arg3         = null,
        $arg4         = null,
        $arg5         = null,
        $arg6         = null,
        $arg7         = null,
        $relatedStart = null,
        $before       = null,
        $params       = null
    ) {
        if( empty( $value ) && self::isArrayOrEmpty( $arg2 ) &&
            empty( $arg3 ) && empty( $arg4 ) && empty( $arg5 ) && empty( $arg6 ) && empty( $arg7 )) {
            $this->assertEmptyValue( Util::$SP0, self::TRIGGER );
            $this->trigger = [
                Util::$LCvalue  => Util::$SP0,
                Util::$LCparams => [],
            ];
            return $this;
        }
        $isArg2ParamsDateTimeSet = self::isDurationParamValueDateTime( $arg2 );
        $params2 = [];
        if( is_array( $arg2 )) {
            $params2 = ParameterFactory::setParams( $arg2, [ Vcalendar::VALUE => Vcalendar::DURATION ] );
            if( isset( $params2[Vcalendar::RELATED] )) {
                $params2[Vcalendar::RELATED] = strtoupper( $params2[Vcalendar::RELATED] );
            }
        }
        switch( true ) {
            // duration DateInterval
            case ( ! $isArg2ParamsDateTimeSet && ( $value instanceof DateInterval )) :
                return $this->setTriggerDateIntervalValue( $value, $params2 );
                break;
            // datetime DateTime
            case ( $value instanceof DateTime ) :
                $arg2[Vcalendar::VALUE] = Vcalendar::DATE_TIME; // force date-time...
                return $this->setTriggerDateTimeValue( $value, $params2 );
                break;

            // datetime as timestamp UTC
            case ( $isArg2ParamsDateTimeSet &&  DateTimeFactory::isArrayTimestampDate( $value )) :
                return $this->setTriggerArrayTimestampValue( $value, $params2 );
                break;

            // duration array
            case ( ! $isArg2ParamsDateTimeSet && DateIntervalFactory::isDurationArray( $value )) :
                return $this->setTriggerArrayDurationValue( $value, $params2 );
                break;
            // duration in a string
            case ( ! $isArg2ParamsDateTimeSet && self::isArrayOrEmpty( $params2 ) &&
                DateIntervalFactory::isStringAndDuration( $value )) :
                return $this->setTriggerStringDurationValue( $value, $params2 );
                break;

            // array date
            case ( $isArg2ParamsDateTimeSet && is_array( $value )) :
                DateTimeFactory::assertArrayDate( $value );
                $value = DateTimeFactory::dateArrayToStr( $value, false, true );
                // fall through
            // date in a string
            case( $isArg2ParamsDateTimeSet && DateTimeFactory::isStringAndDate( $value )) :
                return $this->setTriggerStringDateValue( $value, $params2 );
                break;
            // examine (all) arguments as date(-time)
            case ( DateTimeFactory::isArrayDate( [ $value, $arg2, $arg3 ] ) &&
                ( is_array( $arg7 ) || is_array( $params ))) :
                $params3 = ParameterFactory::setParams( ( is_array( $arg7 )) ? $arg7 : $params );
                if( ParameterFactory::isParamsValueSet( [ Util::$LCparams => $params3 ], self::DATE_TIME )) {
                    return $this->setTriggerStringDateValue(
                        DateTimeFactory::dateArrayToStr(
                            [$value, $arg2, $arg3, $arg4, $arg5, $arg6, self::Z],
                            false,
                            true
                        ),
                        ParameterFactory::setParams( $params3 )
                    );
                    break;
                }
                // fall through
            default :
                // duration
                $params = ParameterFactory::setParams( $params );
                if( is_null( $relatedStart )) { // default
                    $relatedStart = true;
                }
                if( is_null( $before )) { // default
                    $before = true;
                }
                if( $relatedStart && ! self::isDurationRelatedEnd( $params )) {
                    unset( $params[self::RELATED] ); // remove default
                }
                else {
                    $params[self::RELATED] = self::END;
                }
                unset( $params[self::VALUE] );   // self::DURATION default
                if( ! isset( $arg4 )) {
                    $arg4 = 0;
                }
                try {
                    $dateInterval1 = new DateInterval(
                        $durationString = DateIntervalFactory::durationArray2string(
                            DateIntervalFactory::duration2arr(
                                self::var2Array( $value, $arg2, $arg3, $arg4, $arg5, $arg6, $arg7 )
                            )
                        )
                    );
                    if( $before ) {
                        $dateInterval1->invert = 1;
                    }
                    $dateInterval = DateIntervalFactory::conformDateInterval( $dateInterval1 );
                }
                catch( Exception $e ) {
                    throw $e;
                }
                $data                           = (array) $dateInterval; // fix pre 7.0.5 bug
                $this->trigger[Util::$LCvalue]  = $data;
                $this->trigger[Util::$LCparams] = (array) $params;
                return $this;
                break;
        } // end switch( true )
    }

    /**
     * Set trigger DateInterval value
     *
     * @param DateInterval $value
     * @param null|array   $params
     * @return static
     * @throws Exception
     * @access private
     * @since  2.27.2 - 2019-01-04
     */
    private function setTriggerDateIntervalValue( DateInterval $value, $params = null ) {
        try {
            $dateInterval = DateIntervalFactory::conformDateInterval( $value );
        }
        catch( Exception $e ) {
            throw $e;
        }
        if( true != self::isDurationRelatedEnd( $params )) {
            unset( $params[self::RELATED] ); // remove default
        }
        unset( $params[self::VALUE] ); // remove default
        $this->trigger[Util::$LCvalue]  = (array) $dateInterval;  // fix pre 7.0.5 bug
        $this->trigger[Util::$LCparams] = $params;
        return $this;
    }

    /**
     * Set trigger DateTime value
     *
     * @param DateTime $value
     * @param null|array   $params
     * @return static
     * @throws Exception
     * @access private
     * @since  2.27.2 - 2019-01-04
     */
    private function setTriggerDateTimeValue( DateTime $value, $params = null ) {
        unset( $params[self::RELATED] ); // n.a. for date-time
        $data = DateTimeFactory::getDateArrayFromDateTime(
            DateTimeFactory::setDateTimeTimeZone( $value, Vcalendar::UTC )
        );
        $this->trigger = [
            Util::$LCvalue  => $data,
            Util::$LCparams => $params
        ];
        return $this;
    }

    /**
     * Set trigger array timestamp value
     *
     * @param array $value
     * @param null|array   $params
     * @return static
     * @throws Exception
     * @access private
     * @since  2.27.2 - 2019-02-12
     */
    private function setTriggerArrayTimestampValue( array $value, $params = null ) {
        unset( $params[self::RELATED] ); // n.a. for date-time
        $data     = DateTimeFactory::getDateArrayFromDateTime(
            DateTimeFactory::setDateTimeTimeZone(
                DateTimeFactory::getDateTimeFromDateArrayTimestamp( $value ),
                Vcalendar::UTC
            )
        );
        $this->trigger = [
            Util::$LCvalue  => $data,
            Util::$LCparams => $params
        ];
        return $this;
    }

    /**
     * Set trigger array duration value
     *
     * @param array $value
     * @param null|array   $params
     * @return static
     * @throws Exception
     * @access private
     * @since  2.27.14 - 2019-03-01
     */
    private function setTriggerArrayDurationValue( array $value, $params = null ) {
        $before = ( array_key_exists( self::$BEFORE, $value ) &&
            ( false !== $value[self::$BEFORE] ));
        try {
            $dateInterval1 = new DateInterval(
                $durationString = DateIntervalFactory::durationArray2string(
                    DateIntervalFactory::duration2arr( $value )
                )
            );
            $dateInterval1->invert = ( $before ) ? 1 : 0;
            $dateInterval = DateIntervalFactory::conformDateInterval( $dateInterval1 );
        }
        catch( Exception $e ) {
            throw $e;
        }
        if( empty( $params )) {
            $params = [];
        }
        switch( true ) {
            case ( Util::issetKeyAndEquals( $params, self::RELATED, Vcalendar::START )) :
                unset( $params[self::RELATED] ); // remove default
                break;
            case ( Util::issetKeyAndEquals( $params, self::RELATED, Vcalendar::END )) :
                break;
            case ( array_key_exists( self::$RELATEDSTART, $value ) &&
                ( true == $value[self::$RELATEDSTART] )) :
                unset( $params[self::RELATED] ); // remove default
                break;
            case ( array_key_exists( self::$RELATEDSTART, $value ) &&
                ( false == $value[self::$RELATEDSTART] )) :
                $params[self::RELATED] = self::END;
                break;
            default :
                unset( $params[self::RELATED] ); // remove default
                break;
        }
        unset( $params[self::VALUE] ); // remove default
        $this->trigger = [
            Util::$LCvalue  => (array) $dateInterval, // fix pre 7.0.5 bug
            Util::$LCparams => $params
        ];
        return $this;
    }

    /**
     * Set trigger string duration value
     *
     * @param string     $value
     * @param null|array $params
     * @return static
     * @throws Exception
     * @access private
     * @since  2.27.2 - 2019-01-04
     */
    private function setTriggerStringDurationValue( $value, $params = null ) {
        $before = ( Util::$MINUS == $value[0] ) ? true : false;
        if( DateIntervalFactory::$P != $value[0] ) {
            $value = substr( $value, 1 );
        }
        try {
            $dateInterval1 = new DateInterval( $value );
            $dateInterval1->invert = ( $before ) ? 1 : 0;
            $dateInterval = DateIntervalFactory::conformDateInterval( $dateInterval1 );
        }
        catch( Exception $e ) {
            throw $e;
        }
        if( true != self::isDurationRelatedEnd( $params )) {
            unset( $params[self::RELATED] ); // remove default
        }
        unset( $params[self::VALUE] ); // remove default
        $this->trigger = [
            Util::$LCvalue  => (array) $dateInterval, // fix pre 7.0.5 bug
            Util::$LCparams => $params
        ];
        return $this;
    }

    /**
     * Set trigger string date value
     *
     * @param string     $value
     * @param null|array $params
     * @return static
     * @throws Exception
     * @access private
     * @since  2.27.14 - 2019-02-03
     */
    private function setTriggerStringDateValue( $value, $params = null ) {
        unset( $params[self::RELATED] ); // n.a. for date-time
        list( $dateStr, $timezonePart ) = DateTimeFactory::splitIntoDateStrAndTimezone( $value );
        $dateTime = DateTimeFactory::getDateTimeWithTimezoneFromString(
            $dateStr,
            $timezonePart,
            Vcalendar::UTC,
            true
        );
        if( ! DateTimeZoneFactory::isUTCtimeZone( $dateTime->getTimezone()->getName())) {
            $dateTime = DateTimeFactory::setDateTimeTimeZone( $dateTime, Vcalendar::UTC );
        }
        $data = DateTimeFactory::getDateArrayFromDateTime( $dateTime );
        $this->trigger = [
            Util::$LCvalue  => $data,
            Util::$LCparams => $params
        ];
        return $this;
    }

    /**
     * Return bool true if value is array is empty
     *
     * @param array $value
     * @return bool
     * @access private
     * @static
     * @since  2.27.2 - 2019-01-04
     */
    private static function isArrayOrEmpty( $value ) {
        return ( is_array( $value ) || empty( $value ));
    }

    /**
     * Return array of the argument variables
     *
     * @param int    $year
     * @param int    $month
     * @param int    $day
     * @param int    $week
     * @param int    $hour
     * @param int    $min
     * @param int    $sec
     * @return array
     * @access private
     * @static
     * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
     * @since  2.26.7 - 2018-11-30
     */
    private static function var2Array(
        $year  = null,
        $month = null,
        $day   = null,
        $week  = null,
        $hour  = null,
        $min   = null,
        $sec   = null
    ) {
        if( ! empty( $year )) {
            $result[Util::$LCYEAR]  = $year;
        }
        if( ! empty( $month )) {
            $result[Util::$LCMONTH] = $month;
        }
        if( ! empty( $day )) {
            $result[Util::$LCDAY]   = $day;
        }
        if( ! empty( $week )) {
            $result[Util::$LCWEEK]  = $week;
        }
        if( ! empty( $hour )) {
            $result[Util::$LCHOUR]  = $hour;
        }
        if( ! empty( $min )) {
            $result[Util::$LCMIN]   = $min;
        }
        if( ! empty( $sec )) {
            $result[Util::$LCSEC]   = $sec;
        }
        if( empty( $result )) {
            $result[Util::$LCSEC]   = 0;
        }
        return $result;
    }

    /**
     * Return bool true if duration is related END
     *
     * @param null|array $params
     * @return bool
     * @access private
     * @static
     * @since  2.26.7 - 2018-12-01
     */
    private static function isDurationRelatedEnd( $params ) {
        return Util::issetKeyAndEquals( $params, self::RELATED, self::END );
    }

    /**
     * Return bool true if arg is param and TRIGGER value is a DATE-TIME
     *
     * @param null|array $params
     * @return bool
     * @access private
     * @static
     * @since  2.26.14 - 2019-02-14
     */
    private static function isDurationParamValueDateTime( $params ) {
        if( ! is_array( $params )) {
            return false;
        }
        $param = ParameterFactory::setParams( $params );
        return ParameterFactory::isParamsValueSet( [ Util::$LCparams => $param ], self::DATE_TIME );
    }

}
