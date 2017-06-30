/*©agpl*************************************************************************
*                                                                              *
* This file is part of FRIEND UNIFYING PLATFORM.                               *
*                                                                              *
* This program is free software: you can redistribute it and/or modify         *
* it under the terms of the GNU Affero General Public License as published by  *
* the Free Software Foundation, either version 3 of the License, or            *
* (at your option) any later version.                                          *
*                                                                              *
* This program is distributed in the hope that it will be useful,              *
* but WITHOUT ANY WARRANTY; without even the implied warranty of               *
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the                 *
* GNU Affero General Public License for more details.                          *
*                                                                              *
* You should have received a copy of the GNU Affero General Public License     *
* along with this program.  If not, see <http://www.gnu.org/licenses/>.        *
*                                                                              *
*****************************************************************************©*/
/** @file
 *
 *  Timers class: animates PropertyLives properties, and make them evolve with time
 *
 *  Will allow many cool things in the future, like loosing notions, memories,
 *  store in cheaper memory storage if not used (long term memory)...
 *  make them come back after a while etc.
 *
 *  Derived from PropertyLive (timers can also be modified by timers)
 *
 *  @author FL (François Lionet)
 *  @date first pushed on 12/12/2016
 *  @warning: work in progress... toward intelligence!
 */

/**
 * Timers class
 *
 * @param brain root
 * @param parent object who created this class
 * @param name string with the name of the class
 * @param weight number containing the global weight of the class
 * @param extras string with optional properties to create
 */
function Timers(brain, parent, name, weight, extras, propertyReader)
{
    this.brain = brain;
    this.parent = parent;

    mergeObjects(this, PropertyLive);
    mergeObjects(this, Timers);
    PropertyLive.call(this, brain, this, name, weight, extras, function (brain)
    {
        debugger;                   // It works!
    }, propertyReader);
    this.className = "Timers";
}
