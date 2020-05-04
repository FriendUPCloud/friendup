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
use Kigkonsult\Icalcreator\Util\DateTimeFactory;
use Kigkonsult\Icalcreator\Util\ParameterFactory;
use InvalidArgumentException;

use function array_change_key_case;
use function is_array;

/**
 * DTSTAMP property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since 2.27.14 2019-01-28
 */
trait DTSTAMPtrait
{
    /**
     * @var array component property DTSTAMP value
     * @access protected
     */
    protected $dtstamp = null;

    /**
     * Return formatted output for calendar component property dtstamp
     *
     * @return string
     * @since  2.27.14 - 2019-01-27
     */
    public function createDtstamp() {
        if( DateTimeFactory::hasNoDate( $this->dtstamp )) {
            $this->dtstamp = [
                Util::$LCvalue  => DateTimeFactory::getCurrDateArr(),
                Util::$LCparams => [],
            ];
        }
        return StringFactory::createElement(
            self::DTSTAMP,
            ParameterFactory::createParams( $this->dtstamp[Util::$LCparams] ),
            DateTimeFactory::dateArrayToStr( $this->dtstamp[Util::$LCvalue] )
        );
    }

    /**
     * Delete calendar component property dtstamp
     *
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteDtstamp( ) {
        $this->dtstamp = null;
        return true;
    }

    /**
     * Get calendar component property dtstamp
     *
     * @param bool   $inclParam
     * @return bool|array
     * @since  2.27.1 - 2018-12-12
     */
    public function getDtstamp( $inclParam = false ) {
        if( Util::isCompInList( $this->getCompType(), self::$SUBCOMPS )) {
            return false;
        }
        if( empty( $this->dtstamp )) {
            $this->dtstamp = [
                Util::$LCvalue  => DateTimeFactory::getCurrDateArr(),
                Util::$LCparams => [],
            ];
        }
        return ( $inclParam ) ? $this->dtstamp : $this->dtstamp[Util::$LCvalue];
    }

    /**
     * Set calendar component property dtstamp
     *
     * @param mixed  $value
     * @param mixed  $month
     * @param int    $day
     * @param int    $hour
     * @param int    $min
     * @param int    $sec
     * @param string $tz
     * @param array  $params
     * @return static
     * @throws InvalidArgumentException
     * @since 2.27.14 2019-02-10
     */
    public function setDtstamp(
        $value  = null,
        $month  = null,
        $day    = null,
        $hour   = null,
        $min    = null,
        $sec    = null,
        $tz     = null,
        $params = null
    ) {
        if( empty( $value )) {
            $this->dtstamp = [
                Util::$LCvalue  => DateTimeFactory::getCurrDateArr(),
                Util::$LCparams => [],
            ];
            return $this;
        }
        if( DateTimeFactory::isArgsDate( $value, $month, $day )) {
            $value = DateTimeFactory::argsToStr( $value, $month, $day, $hour, $min, $sec, $tz );
            if( is_array( $params )) {
                $month = $params;
            }
            else {
                $month = ( is_array( $hour )) ? $hour : [];
            }
        }
        elseif( ! is_array( $month )) {
            $month = [];
        }
        $month[Vcalendar::VALUE] = Vcalendar::DATE_TIME;
        $this->dtstamp = DateTimeFactory::setDate(
            $value,
            array_change_key_case( $month, CASE_UPPER ),
            true // $forceUTC
        );
        return $this;
    }
}
