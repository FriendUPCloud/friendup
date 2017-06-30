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
/**
 * @file
 *
 *  Contains the notions
 *
 *  A notion is an association of properties like objects, destinations,
 *  origins, speeds... resulting of a global "concept" (rename class?)
 *  about the "idea" (or rename to?) included in the notion.
 *  It is perfectly possible to create notions as soon as a command is used
 *  many times with the same 'needs' (property defined in the brain-script) FL>HT Brain-Script good name for the language!
 *  You can make notions disappear with time or crisis (robotic alzheimher?)
 *  Notions of notions are possible too ('concepts', new class?)
 *  and concepts of ...(endless)... concepts ('creator', new class?) 'god'? :)
 *  ... all this can orient decisions...
 *  FL>FL To implement!
 *
 *  The list of notions is supposed to grow as the intelligence and memory grows.
 *  Derived from Property.
 *
 *  @author FL (François Lionet)
 *  @date first pushed on 15/12/2016
 *  @warning: work in progress... toward intelligence!
 */


/**
 * Notion class
 *
 * @param brain root
 * @param parent object who created this class
 * @param name string with the name of the class
 * @param weight number containing the global weight of the class
 * @param extras string with optional properties to create
 */
function Notions(brain, parent, name, weight, extras, propertyReader)
{
    this.brain = brain;
    this.parent = parent;

    mergeObjects(this, PropertyLive);
    mergeObjects(this, Notion);
    PropertyLive.call(this, brain, this, name, weight, extras, function (brain)
    {
        debugger;                   // It works!
    }, propertyReader);
    this.className = "Notions";
}
