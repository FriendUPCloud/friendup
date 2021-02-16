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
use Kigkonsult\Icalcreator\Util\ParameterFactory;

use function is_numeric;

/**
 * SEQUENCE property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.3 - 2018-12-22
 */
trait SEQUENCEtrait
{
    /**
     * @var array component property SEQUENCE value
     * @access protected
     */
    protected $sequence = null;

    /**
     * Return formatted output for calendar component property sequence
     *
     * @return string
     */
    public function createSequence() {
        if( empty( $this->sequence )) {
            return null;
        }
        if(( ! isset( $this->sequence[Util::$LCvalue] ) ||
                ( empty( $this->sequence[Util::$LCvalue] ) && ! is_numeric( $this->sequence[Util::$LCvalue] ))) &&
                ( Util::$ZERO != $this->sequence[Util::$LCvalue] )) {
            return ( $this->getConfig( self::ALLOWEMPTY )) ? StringFactory::createElement( self::SEQUENCE ) : null;
        }
        return StringFactory::createElement(
            self::SEQUENCE,
            ParameterFactory::createParams( $this->sequence[Util::$LCparams] ),
            $this->sequence[Util::$LCvalue]
        );
    }

    /**
     * Delete calendar component property sequence
     *
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteSequence() {
        $this->sequence = null;
        return true;
    }

    /**
     * Get calendar component property sequence
     *
     * @param bool   $inclParam
     * @return bool|array
     * @since  2.27.1 - 2018-12-12
     */
    public function getSequence( $inclParam = false ) {
        if( empty( $this->sequence )) {
            return false;
        }
        return ( $inclParam ) ? $this->sequence : $this->sequence[Util::$LCvalue];
    }

    /**
     * Set calendar component property sequence
     *
     * @param int   $value
     * @param array $params
     * @return static
     * @since  2.27.2 - 2019-01-04
     */
    public function setSequence( $value = null, $params = null ) {
        if(( empty( $value ) && ! is_numeric( $value )) && ( Util::$ZERO != $value )) {
            $value = ( isset( $this->sequence[Util::$LCvalue] ) &&
                ( -1 < $this->sequence[Util::$LCvalue] ))
                ? $this->sequence[Util::$LCvalue] + 1
                : Util::$ZERO;
        }
        else {
            self::assertIsInteger( $value, self::SEQUENCE );
        }
        $this->sequence = [
            Util::$LCvalue  => $value,
            Util::$LCparams => ParameterFactory::setParams( $params ),
        ];
        return $this;
    }
}
