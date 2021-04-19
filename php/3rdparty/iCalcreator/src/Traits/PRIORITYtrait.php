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
use InvalidArgumentException;

/**
 * PRIORITY property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since 2.27.2 2019-01-03
 */
trait PRIORITYtrait
{
    /**
     * @var array component property PRIORITY value
     * @access protected
     */
    protected $priority = null;

    /**
     * Return formatted output for calendar component property priority
     *
     * @return string
     */
    public function createPriority() {
        if( empty( $this->priority )) {
            return null;
        }
        if( ! isset( $this->priority[Util::$LCvalue] ) ||
            ( empty( $this->priority[Util::$LCvalue] ) && ! is_numeric( $this->priority[Util::$LCvalue] ))) {
            return ( $this->getConfig( self::ALLOWEMPTY )) ? StringFactory::createElement( self::PRIORITY ) : null;
        }
        return StringFactory::createElement(
            self::PRIORITY,
            ParameterFactory::createParams( $this->priority[Util::$LCparams] ),
            $this->priority[Util::$LCvalue]
        );
    }

    /**
     * Delete calendar component property priority
     *
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deletePriority() {
        $this->priority = null;
        return true;
    }

    /**
     * Get calendar component property priority
     *
     * @param bool   $inclParam
     * @return bool|array
     * @since  2.27.1 - 2018-12-12
     */
    public function getPriority( $inclParam = false ) {
        if( empty( $this->priority )) {
            return false;
        }
        return ( $inclParam ) ? $this->priority : $this->priority[Util::$LCvalue];
    }

    /**
     * Set calendar component property priority
     *
     * @param int   $value
     * @param array $params
     * @return static
     * @throws InvalidArgumentException
     * @since 2.27.2 2019-01-03
     */
    public function setPriority( $value = null, $params = null ) {
        if( empty( $value ) && ( Util::$ZERO != $value )) {
            $this->assertEmptyValue( $value, self::PRIORITY );
            $value  = Util::$SP0;
            $params = [];

        }
        else {
            self::assertIsInteger( $value, self::PRIORITY, 0, 9 );
        }
        $this->priority = [
            Util::$LCvalue  => $value,
            Util::$LCparams => ParameterFactory::setParams( $params ),
        ];
        return $this;
    }
}
