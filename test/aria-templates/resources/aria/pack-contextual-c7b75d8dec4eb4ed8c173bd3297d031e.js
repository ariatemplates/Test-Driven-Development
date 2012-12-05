/*
 * Copyright 2012 Amadeus s.a.s.
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
//***MULTI-PART
//*******************
//LOGICAL-PATH:aria/tools/contextual/ContextualDisplay.tpl
//*******************

// Content of the contextual menu for templates
{Template {
    $classpath:'aria.tools.contextual.ContextualDisplay',
    $hasScript:true
}}

    {macro main()}
        {@aria:Div {
            sclass : "dropdown"
        }}
            <div style="padding:5px;">
                <table cellpadding="0" cellspacing="5">
                    <tr>
                        <td align="right">Template:</td>
                        <td><strong>${data.templateCtxt.tplClasspath}</strong></td>
                    </tr>
                    {if (data.templateCtxt.moduleCtrlPrivate)}
                        <tr>
                            <td align="right">Module Controller:</td>
                            <td><strong>${data.templateCtxt.moduleCtrlPrivate.$classpath}</strong></td>
                        </tr>
                    {/if}
                </table>
                <div style="text-align:center; padding:5px; background:#F3F3F3; border:solid 1px #DDDDDD;">
                    {@aria:Button {label:"Reload Template", onclick : "reloadTemplate"}/}
                    {if aria.templates.ModuleCtrlFactory.isModuleCtrlReloadable(data.templateCtxt.moduleCtrlPrivate)}
                        {@aria:Button {label:"Reload Module", onclick : "reloadModule"}/}
                    {/if}
                     {@aria:Button {label:"Debug Tools", onclick: "openDebug"}/}
                 </div>
            </div>

        {/@aria:Div}
    {/macro}
    

{/Template}
//*******************
//LOGICAL-PATH:aria/tools/contextual/ContextualDisplayScript.js
//*******************
Aria.tplScriptDefinition({$classpath:"aria.tools.contextual.ContextualDisplayScript",$prototype:{openDebug:function(e){var t=this.data.driver;t.openTools()},reloadTemplate:function(e){this.data.templateCtxt.$reload(),this.data.driver.close()},reloadModule:function(){aria.templates.ModuleCtrlFactory.reloadModuleCtrl(this.data.templateCtxt.moduleCtrlPrivate),this.data.driver.close()}}});
//*******************
//LOGICAL-PATH:aria/tools/contextual/ContextualMenu.js
//*******************
(function(){var e=null,t=null,n=null,r=null;Aria.classDefinition({$classpath:"aria.tools.contextual.ContextualMenu",$singleton:!0,$dependencies:["aria.utils.Event","aria.DomEvent","aria.templates.TemplateCtxtManager","aria.popups.Popup","aria.widgets.Template","aria.utils.Dom","aria.tools.contextual.environment.ContextualMenu","aria.utils.AriaWindow"],$implements:["aria.tools.contextual.IContextualMenu"],$constructor:function(){e=aria.utils.Event,t=aria.templates.TemplateCtxtManager,n=aria.tools.contextual.environment.ContextualMenu,r=aria.utils.Dom,this._enabled=!1,this._popup=null,this.targetTemplateCtxt=null,this._appEnvCfg=null,n.$on({environmentChanged:this._environmentChanged,scope:this}),this._environmentChanged(),aria.utils.AriaWindow.$on({attachWindow:this._attachWindow,detachWindow:this._detachWindow,scope:this})},$destructor:function(){aria.core.environment.Environment.$unregisterListeners(this),aria.utils.AriaWindow.$unregisterListeners(this),this._setEnabled(!1),this._popup&&this._popup.close(),this.targetTemplateCtxt=null},$prototype:{_attachWindow:function(){var e=n.getContextualMenu();this._setEnabled(e.enabled)},_detachWindow:function(){this._setEnabled(!1)},_environmentChanged:function(){var e=n.getContextualMenu();this._appEnvCfg=e,this._setEnabled(e.enabled)},_setEnabled:function(t){var n=Aria.$window.document;t?aria.widgets.AriaSkin&&(this._enabled=!0,e.addListener(n,"contextmenu",{fn:this._onContextMenu,scope:this}),aria.core.Browser.isSafari&&e.addListener(n,"mouseup",{fn:this._onSafariMouseUp,scope:this})):(this._enabled=!1,e.removeListener(n,"contextmenu",{fn:this._onContextMenu}),aria.core.Browser.isSafari&&e.removeListener(n,"mouseup",{fn:this._onSafariMouseUp}))},_onSafariMouseUp:function(e){this._safariCtrlKey=e.ctrlKey},_onContextMenu:function(e){if(!this._enabled)return;e=new aria.DomEvent(e),aria.core.Browser.isSafari&&(e.ctrlKey=this._safariCtrlKey);if(e.ctrlKey){e.stopPropagation(),e.preventDefault();var t=e.target;return this.__callContextualMenu(t,e.clientX,e.clientY),e.$dispose(),!1}e.$dispose()},open:function(e,t){this._popup&&aria.tools.contextual.ContextualMenu.close();var n={};t?n=t:e.$TemplateCtxt?n={x:0,y:0}:n=r.getGeometry(e);if(e.$TemplateCtxt){this._notifyFound(e,n.x,n.y);return}return this.__callContextualMenu(e,n.x,n.y),!1},__callContextualMenu:function(e,n,r){var i,s=Aria.$window.document.body;while(e&&e!=s&&!e.__template)i=e,e=e.parentNode;if(e==s&&i){if(aria.popups&&aria.popups.PopupManager){var o=aria.popups.PopupManager.getPopupFromDom(i);o&&o.section&&o.section.tplCtxt&&this._notifyFound(o.section.tplCtxt,n,r)}}else e&&e!=s&&this._notifyFound(t.getFromDom(e.parentNode),n,r)},_afterClose:function(e){this._popup&&(this._popup.$dispose(),this._popup=null)},_notifyFound:function(e,t,n){var r=aria.tools.ToolsBridge;r&&r.isOpen&&r.$raiseEvent({name:"forwardEvent",event:{name:"ContextualTargetFound",templateCtxt:e}});if(this._popup)return;var i=new aria.popups.Popup;this._popup=i,i.$on({onAfterClose:this._afterClose,scope:this});var s=e.createSection({fn:function(t){var n=new aria.widgets.Template({defaultTemplate:this._appEnvCfg.template,moduleCtrl:{classpath:this._appEnvCfg.moduleCtrl,initArgs:{templateCtxt:e.$interface("aria.templates.ITemplateCtxt"),driver:this.$interface("aria.tools.contextual.IContextualMenu")}}},e,"NOLINE");t.registerBehavior(n),n.writeMarkup(t)},scope:this});i.open({section:s,absolutePosition:{top:n,left:t},modal:!0,maskCssClass:"xDialogMask",preferredPositions:[{reference:"bottom left",popup:"top left"},{reference:"bottom left",popup:"top right"}],offset:{top:0,left:0},closeOnMouseClick:!0,closeOnMouseScroll:!0}),this.targetTemplateCtxt=e},close:function(){this.targetTemplateCtxt=null,this._popup&&this._popup.close()},openTools:function(){(!aria.tools.ToolsBridge||!aria.tools.ToolsBridge.isOpen)&&Aria.load({classes:["aria.tools.ToolsBridge"],oncomplete:function(){aria.tools.ToolsBridge.open(),aria.tools.contextual.ContextualMenu.close()}})}}})})();
//*******************
//LOGICAL-PATH:aria/tools/contextual/ContextualModule.js
//*******************
Aria.classDefinition({$classpath:"aria.tools.contextual.ContextualModule",$extends:"aria.templates.ModuleCtrl",$constructor:function(){this.$ModuleCtrl.constructor.call(this)},$prototype:{init:function(e,t){this._data=e,this.$callback(t)}}});
//*******************
//LOGICAL-PATH:aria/tools/contextual/IContextualMenu.js
//*******************
Aria.interfaceDefinition({$classpath:"aria.tools.contextual.IContextualMenu",$interface:{close:"Function",open:"Function",openTools:"Function"}});