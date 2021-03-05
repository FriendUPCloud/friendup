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
use Kigkonsult\Icalcreator\Util\Util;
use Kigkonsult\Icalcreator\Util\DateIntervalFactory;
use Kigkonsult\Icalcreator\Util\ParameterFactory;
use DateInterval;
use Exception;
use InvalidArgumentException;

use function count;
use function is_array;

/**
 * DURATION property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.3 - 2018-12-22
 */
trait DURATIONtrait
{
    /**
     * @var array component property DURATION value
     * @access protected
     */
    protected $duration = null;

    /**
     * Return formatted output for calendar component property duration
     *
     * @return string
     * @throws Exception
     * @since  2.27.2 - 2018-12-21
     */
    public function createDuration() {
        if( empty( $this->duration )) {
            return null;
        }
        if( empty( $this->duration[Util::$LCvalue] )) {
            return ( $this->getConfig( self::ALLOWEMPTY ))
                ? StringFactory::createElement( self::DURATION )
                : null;
        }
        if( isset( $this->duration[Util::$LCvalue]['invert'] )) { // fix pre 7.0.5 bug
            try {
                $dateInterval = DateIntervalFactory::DateIntervalArr2DateInterval( $this->duration[Util::$LCvalue] );
            }
            catch( Exception $e ) {
                throw $e;
            }
        }
        return StringFactory::createElement(
            self::DURATION,
            ParameterFactory::createParams( $this->duration[Util::$LCparams] ),
            DateIntervalFactory::dateInterval2String( $dateInterval )
        );
    }

    /**
     * Delete calendar component property duration
     *
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteDuration( ) {
        $this->duration = null;
        return true;
    }

    /**
     * Get calendar component property duration
     *
     * @param bool   $inclParam
     * @param bool   $specform
     * @return bool|array
     * @throws Exception
     * @since  2.27.2 - 2019-01-08
     */
    public function getDuration( $inclParam = false, $specform = false ) {
        if( empty( $this->duration )) {
            return false;
        }
        if( empty( $this->duration[Util::$LCvalue] )) {
            return ( $inclParam ) ? $this->duration : $this->duration[Util::$LCvalue];
        }
        if( isset( $this->duration[Util::$LCvalue]['invert'] )) { // fix pre 7.0.5 bug
            try {
                $dateInterval = DateIntervalFactory::DateIntervalArr2DateInterval( $this->duration[Util::$LCvalue] );
            }
            catch( Exception $e ) {
                throw $e;
            }
        }
        if( $specform ) {
            $dtStart = (array) $this->dtstart;
            if( isset( $dtstart[Util::$LCparams][self::TZID] )) {
                $dtStart[Util::$LCvalue][Util::$LCtz] = $dtStart[Util::$LCparams][self::TZID];
            }
            $value = DateIntervalFactory::dateInterval2date( $dtStart[Util::$LCvalue], $dateInterval );
            if( $inclParam && isset( $dtStart[Util::$LCparams][self::TZID] )) {
                $params = array_merge( $this->duration[Util::$LCparams], $dtStart[Util::$LCparams] );
            }
            else {
                $params = $this->duration[Util::$LCparams];
            }
        }
        else {
            $value  = DateIntervalFactory::dateInterval2arr( $dateInterval );
            $params = $this->duration[Util::$LCparams];
        }
        if( isset( $value[Util::$LCWEEK] ) && empty( $value[Util::$LCWEEK] )) {
            unset( $value[Util::$LCWEEK] );
        }
        return ( $inclParam ) ? [ Util::$LCvalue  => $value, Util::$LCparams => (array) $params, ] : $value;
    }

    /**
     * Set calendar component property duration
     *
     * @param mixed $value
     * @param mixed $day
     * @param int   $hour
     * @param int   $min
     * @param int   $sec
     * @param array $params
     * @return static
     * @throws InvalidArgumentException
     * @throws Exception
     * @since  2.27.14 - 2019-02-20
     * @todo "When the "DURATION" property relates to a
     *        "DTSTART" property that is specified as a DATE value, then the
     *        "DURATION" property MUST be specified as a "dur-day" or "dur-week"
     *        value."
     */
    public function setDuration(
        $value  = null,
        $day    = null,
        $hour   = null,
        $min    = null,
        $sec    = null,
        $params = null
    ) {
        switch( true ) {
            case ( empty( $value ) && empty( $hour ) && empty( $min ) && empty( $sec ) &&
                ( empty( $day ) || is_array( $day))) :
                $this->assertEmptyValue( $value, self::DURATION );
                $this->duration = [
                    Util::$LCvalue  => Util::$SP0,
                    Util::$LCparams => []
                ];
                return $this;
                break;
            case( $value instanceof DateInterval ) :
                $value = DateIntervalFactory::conformDateInterval( $value );
                $params = $day;
                break;
            case DateIntervalFactory::isStringAndDuration( $value ) :
                $value = StringFactory::trimTrailNL( trim( $value ));
                $value = DateIntervalFactory::removePlusMinusPrefix( $value ); // can only be positive
                try {
                    $dateInterval = new DateInterval( $value );
                    $value        = DateIntervalFactory::conformDateInterval( $dateInterval );
                }
                catch( Exception $e ) {
                    throw new InvalidArgumentException( $e->getMessage(), null, $e );
                }
                $params = $day;
                break;
            case ( is_array( $value ) && ( 1 <= count( $value ))) :
                try {
                    $dateInterval = new DateInterval(
                        DateIntervalFactory::durationArray2string(
                            DateIntervalFactory::duration2arr( $value )
                        )
                    );
                    $value = DateIntervalFactory::conformDateInterval( $dateInterval );
                }
                catch( Exception $e ) {
                    throw new InvalidArgumentException( $e->getMessage(), null, $e );
                }
                $params = $day;
                break;
            default :
                try {
                    $dateInterval = new DateInterval(
                        DateIntervalFactory::durationArray2string(
                            DateIntervalFactory::duration2arr(
                                [
                                    Util::$LCWEEK => (int) $value,
                                    Util::$LCDAY  => (int) $day,
                                    Util::$LCHOUR => (int) $hour,
                                    Util::$LCMIN  => (int) $min,
                                    Util::$LCSEC  => (int) $sec,
                                ]
                            )
                        )
                    );
                    $value = DateIntervalFactory::conformDateInterval( $dateInterval );
                }
                catch( Exception $e ) {
                    throw new InvalidArgumentException( $e->getMessage(), null, $e );
                }
                break;
        } // end switch
        $this->duration = [
            Util::$LCvalue  => (array) $value,  // fix pre 7.0.5 bug
            Util::$LCparams => ParameterFactory::setParams( $params ),
        ];
        return $this;
    }
}
