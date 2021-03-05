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
use Kigkonsult\Icalcreator\Util\RecurFactory;
use InvalidArgumentException;
use Exception;
/**
 * RRULE property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.14 - 2019-01-10
 * @todo follow rfc5545 restriction: RRULE .. SHOULD NOT occur more than once
 */
trait RRULEtrait
{
    /**
     * @var array component property RRULE value
     * @access protected
     */
    protected $rrule = null;

    /**
     * Return formatted output for calendar component property rrule
     *
     * "Recur UNTIL, the value of the UNTIL rule part MUST have the same value type as the "DTSTART" property."
     * @return string
     * @since  2.27.13 - 2019-01-09
     */
    public function createRrule() {
        return RecurFactory::formatRecur(
            self::RRULE,
            $this->rrule,
            $this->getConfig( self::ALLOWEMPTY ),
            $this->getDtstartParams()
        );
    }

    /**
     * Delete calendar component property rrule
     *
     * @param int   $propDelIx   specific property in case of multiply occurrence
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteRrule( $propDelIx = null ) {
        if( empty( $this->rrule )) {
            unset( $this->propDelIx[self::RRULE] );
            return false;
        }
        $propDelIx = 1; // rfc5545 restriction: .. SHOULD NOT occur more than once
        return $this->deletePropertyM( $this->rrule, self::RRULE, $propDelIx );
    }

    /**
     * Get calendar component property rrule
     *
     * @param int    $propIx specific property in case of multiply occurrence
     * @param bool   $inclParam
     * @return bool|array
     * @since  2.27.1 - 2018-12-12
     */
    public function getRrule( $propIx = null, $inclParam = false ) {
        if( empty( $this->rrule )) {
            unset( $this->propIx[self::RRULE] );
            return false;
        }
        $propIx = 1; // rfc5545 restriction: .. SHOULD NOT occur more than once
        return $this->getPropertyM( $this->rrule, self::RRULE, $propIx, $inclParam );
    }

    /**
     * Set calendar component property rrule
     *
     * @param array   $rruleset
     * @param array   $params
     * @param integer $index
     * @return static
     * @throws InvalidArgumentException
     * @throws Exception
     * @since 2.27.3 2018-12-22
     */
    public function setRrule( $rruleset = null, $params = null, $index = null ) {
        if( empty( $rruleset )) {
            $this->assertEmptyValue( $rruleset, self::RRULE );
            $rruleset = Util::$SP0;
            $params   = [];

        }
        $index = 1; // rfc5545 restriction: .. SHOULD NOT occur more than once
        $this->setMval(
            $this->rrule,
            RecurFactory::setRexrule( $rruleset, $this->getDtstartParams()),
            $params,
            null,
            $index
        );
        return $this;
    }
}
