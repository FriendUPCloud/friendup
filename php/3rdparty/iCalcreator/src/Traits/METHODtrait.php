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

use Kigkonsult\Icalcreator\Util\Util;

use function sprintf;

/**
 * METHOD property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.3 - 2018-12-22
 */
trait METHODtrait
{
    /**
     * @var string calendar property METHOD
     * @access protected
     */
    protected $method = null;

    /**
     * Return formatted output for calendar property method
     *
     * @return string
     */
    public function createMethod() {
        return ( empty( $this->method ))
            ? null
            : sprintf( self::$FMTICAL, self::METHOD, $this->method );
    }

    /**
     * Delete calendar component property method
     *
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteMethod() {
        $this->method = null;
        return true;
    }

    /**
     * Return method
     *
     * @return string
     * @since  2.27.1 - 2018-12-15
     */
    public function getMethod() {
        if( empty( $this->method )) {
            return false;
        }
        return $this->method;
    }

    /**
     * Set calendar property method
     *
     * @param string $value
     * @return static
     * @since  2.27.3 - 2018-12-22
     */
    public function setMethod( $value ) {
        if( empty( $value )) {
            $this->assertEmptyValue( $value, self::METHOD );
            $value = Util::$SP0;
        }
        $this->method = $value;
        return $this;
    }
}
