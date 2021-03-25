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
use Kigkonsult\Icalcreator\Util\CalAddressFactory;
use InvalidArgumentException;

use function trim;

/**
 * ORGANIZER property functions
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.8 - 2019-03-17
 */
trait ORGANIZERtrait
{
    /**
     * @var array component property ORGANIZER value
     * @access protected
     */
    protected $organizer = null;

    /**
     * Return formatted output for calendar component property organizer
     *
     * @return string
     */
    public function createOrganizer() {
        if( empty( $this->organizer )) {
            return null;
        }
        if( empty( $this->organizer[Util::$LCvalue] )) {
            return ( $this->getConfig( self::ALLOWEMPTY ))
                ? StringFactory::createElement( self::ORGANIZER ) : null;
        }
        return StringFactory::createElement(
            self::ORGANIZER,
            ParameterFactory::createParams(
                $this->organizer[Util::$LCparams],
                [
                    self::CN,
                    self::DIR,
                    self::SENT_BY,
                    self::LANGUAGE,
                ],
                $this->getConfig( self::LANGUAGE )
            ),
            $this->organizer[Util::$LCvalue]
        );
    }

    /**
     * Delete calendar component property organizer
     *
     * @return bool
     * @since  2.27.1 - 2018-12-15
     */
    public function deleteOrganizer() {
        $this->organizer = null;
        return true;
    }

    /**
     * Get calendar component property organizer
     *
     * @param bool   $inclParam
     * @return bool|array
     * @since  2.27.1 - 2018-12-12
     */
    public function getOrganizer( $inclParam = false ) {
        if( empty( $this->organizer )) {
            return false;
        }
        return ( $inclParam ) ? $this->organizer : $this->organizer[Util::$LCvalue];
    }

    /**
     * Set calendar component property organizer
     *
     * @param string $value
     * @param array  $params
     * @return static
     * @throws InvalidArgumentException
     * @since  2.27.8 - 2019-03-17
     */
    public function setOrganizer( $value = null, $params = null ) {
        if( empty( $value )) {
            $this->assertEmptyValue( $value, self::ORGANIZER );
            $value  = Util::$SP0;
            $params = [];

        }
        $value = CalAddressFactory::conformCalAddress( $value );
        if( ! empty( $value )) {
            CalAddressFactory::assertCalAddress( $value );
        }
        $this->organizer = [
            Util::$LCvalue  => $value,
            Util::$LCparams => ParameterFactory::setParams( $params ),
        ];
        if( isset( $this->organizer[Util::$LCparams][self::SENT_BY] )) {
            $sentBy = CalAddressFactory::conformCalAddress(
                trim( $this->organizer[Util::$LCparams][self::SENT_BY], Util::$QQ )
            );
            CalAddressFactory::assertCalAddress( $sentBy );
            $this->organizer[Util::$LCparams][self::SENT_BY] = $sentBy;
        }
        return $this;
    }
}
