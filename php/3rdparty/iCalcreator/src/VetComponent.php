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

namespace Kigkonsult\Icalcreator;

use InvalidArgumentException;

use function sprintf;
use function strtolower;
use function ucfirst;

/**
 * iCalcreator VEVENT/VTODO component base class
 *
 * @author Kjell-Inge Gustafsson, kigkonsult <ical@kigkonsult.se>
 * @since  2.27.6 - 2018-12-27
 */
abstract class VetComponent extends Vcomponent
{
    /**
     * Return new calendar component, included in component
     *
     * @param string $compType component type
     * @return CalendarComponent
     * @throws InvalidArgumentException
     * @deprecated in favor of new<component> methods
     * @since  2.27.2 - 2018-12-21
     */
    public function newComponent( $compType ) {
        static $ERRMSG = 'Unknown component %s';
        switch( ucfirst( strtolower( $compType ))) {
            case self::VALARM :
                return $this->newValarm();
                break;
            default:
                break;
        }
        throw new InvalidArgumentException( sprintf( $ERRMSG, $compType ));
    }

    /**
     * Return Valarm object instance
     *
     * @return Valarm
     * @since  2.27.2 - 2018-12-21
     */
    public function newValarm() {
        $ix = $this->getNextComponentIndex();
        $this->components[$ix] = new Valarm( $this->getConfig());
        return $this->components[$ix];
    }
}
