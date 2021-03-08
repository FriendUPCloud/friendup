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

use InvalidArgumentException;

/**
 * VERSION property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since 2.27.3 2018-12-22
 */
trait VERSIONtrait
{
    /**
     * Property Name: VERSION
     *
     * Description: A value of "2.0" corresponds to this memo.
     *
     * @var string calendar property VERSION
     * @access protected
     */
    protected $version = '2.0';

    /**
     * Return formatted output for calendar property version
     *
     * @return string
     */
    public function createVersion() {
        return sprintf( self::$FMTICAL, self::VERSION, $this->version );
    }

    /**
     * Return version
     *
     * @return string
     * @since  2.27.1 - 2018-12-16
     */
    public function getVersion() {
        return $this->version;
    }

    /**
     * Set (another?) calendar version
     *
     * @param string $value
     * @return static
     * @throws InvalidArgumentException
     * @since 2.27.3 2018-12-22
     */
    public function setVersion( $value ) {
        if( empty( $value )) {
            $this->assertEmptyValue( $value, self::VERSION );
        }
        $this->version = $value;
        return $this;
    }
}
