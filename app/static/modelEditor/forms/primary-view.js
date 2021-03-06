var $ = require('jquery');
var _ = require('underscore');

var View = require('ampersand-view');
var AmpersandModel = require('ampersand-model');
var URL = require('url-parse');
var ModelEditorView = require('../forms/model');
var ModelSelectView = require('../select/model-collection');
var MeshCollection = require('../models/mesh-collection');
var MeshSelectView = require('../forms/mesh-collection');

module.exports = View.extend({
    props : {
        selected : 'object',
        modelNameText : 'string'
    },
    bindings : {
        modelNameText : {
            type : 'text',
            hook : 'modelName'
        },
        selected : [
            {
                type : 'toggle',
                selector : '.reqModel'
            }
        ]
    },
    updateModelNameText : function()
    {
        if(this.selected) {
            this.modelNameText = '(current: ' + this.selected.name + ')';
        }
        else
        {
            this.modelNameText =  '';
        }
    },
    updateSaveMessage: function( state, msg )
    {
        var saveMessageDom = $( this.queryByHook('saveMessage') );

        if(typeof(state) == "boolean")
        {
            if(state)
            {
                saveMessageDom.removeClass( "alert-error" );
                saveMessageDom.addClass( "alert-success" );
                saveMessageDom.text( msg );                
            }
            else
            {
                saveMessageDom.removeClass( "alert-success" );
                saveMessageDom.addClass( "alert-error" );
                saveMessageDom.text( msg );
            }
        }
        else
        {
            if(this.selected.saveState == 'saved')
            {
                saveMessageDom.removeClass( "alert-error" );
                saveMessageDom.addClass( "alert-success" );
                saveMessageDom.text( "Saved" );
            }
            else if(this.selected.saveState == 'saving')
            {
                saveMessageDom.removeClass( "alert-success alert-error" );
                saveMessageDom.text( "Saving..." );
            }
            else if(this.selected.saveState == 'failed')
            {
                saveMessageDom.removeClass( "alert-success" );
                saveMessageDom.addClass( "alert-error" );
                saveMessageDom.text( "Model Save Failed!" );
            }
            else if(this.selected.saveState == 'invalid')
            {
                saveMessageDom.removeClass( "alert-success" );
                saveMessageDom.addClass( "alert-error" );
                saveMessageDom.text( this.message );
            }
        }
    },
    updateValid : function()
    {
        this.modelSelector.updateValid();

        this.valid = this.modelSelector.valid;
        this.message = '';

        if(!this.modelSelector.valid)
            this.message = this.modelSelector.message;

        if(this.modelEditor)
        {
            this.modelEditor.updateValid();
            
            this.valid = this.valid && this.modelEditor.valid
            
            if(!this.modelEditor.valid && this.message.length == 0)
                this.message = this.modelEditor.message;
        }
    },
    update : function()
    {
        this.updateModelNameText();

        var lastValid = this.valid;

        this.updateValid();

        if(!this.valid)
            this.updateSaveMessage( false, this.message );

        if(lastValid != this.valid && lastValid == false)
        {
            this.saveModel();
        }
    },
    saveModel: function(model)
    {
        this.updateValid();

        if(this.valid)
        {
            if(this.selected)
                this.selected.saveModel();
        }
        else if(!this.valid)
        {
            this.updateSaveMessage( false, this.message );
        }
    },
    initialize: function(attr, options)
    {
        View.prototype.initialize.call(this, attr, options);

        this.meshCollection = attr.meshCollection;

        $( "[data-hook='exportToPublic']" ).click(_.bind(this.exportModel, this));
        $( "[data-hook='exportToZip']" ).click(_.bind(this.exportModelAsZip, this));
        $( "[data-hook='exportToSBML']" ).click(_.bind(this.exportModelAsSBML, this));
        $( "[data-hook='runSimulation']" ).click(_.bind(this.runSimulation, this));

        $( '[data-hook="duplicateLink"]' ).click( _.bind( function() {
            this.modelEditor.duplicateModel();
        }, this ) );
        $( '[data-hook="convertToPopulationLink"]' ).click( _.bind( function() {
            this.modelEditor.convertToPopulation();

            if(!$( this.el ).find('.speciesAccordion .accordion-body').first().hasClass('in'))
                $( this.el ).find('.speciesAccordion').find('a').first()[0].click();
            if(!$( this.el ).find('.parametersAccordion .accordion-body').first().hasClass('in'))
                $( this.el ).find('.parametersAccordion').find('a').first()[0].click();
            if(!$( this.el ).find('.mesh3dAccordion .accordion-body').first().hasClass('in'))
                $( this.el ).find('.mesh3dAccordion').find('a').first()[0].click();
            if(!$( this.el ).find('.initialConditionsAccordion .accordion-body').first().hasClass('in'))
                $( this.el ).find('.initialConditionsAccordion').find('a').first()[0].click();
            if(!$( this.el ).find('.reactionsAccordion .accordion-body').first().hasClass('in'))
                $( this.el ).find('.reactionsAccordion').find('a').first()[0].click();
        }, this ) );
        $( '[data-hook="convertToSpatialLink"]' ).click( _.bind( function() {
            this.modelEditor.convertToSpatial();

            if(!$( this.el ).find('.speciesAccordion .accordion-body').first().hasClass('in'))
                $( this.el ).find('.speciesAccordion').find('a').first()[0].click();
            if(!$( this.el ).find('.parametersAccordion .accordion-body').first().hasClass('in'))
                $( this.el ).find('.parametersAccordion').find('a').first()[0].click();
            if(!$( this.el ).find('.mesh3dAccordion .accordion-body').first().hasClass('in'))
                $( this.el ).find('.mesh3dAccordion').find('a').first()[0].click();
            if(!$( this.el ).find('.initialConditionsAccordion .accordion-body').first().hasClass('in'))
                $( this.el ).find('.initialConditionsAccordion').find('a').first()[0].click();
            if(!$( this.el ).find('.reactionsAccordion .accordion-body').first().hasClass('in'))
                $( this.el ).find('.reactionsAccordion').find('a').first()[0].click();
        }, this ) );
    },
    remove : function()
    {
        $( '[data-hook="duplicateLink"]' ).off( 'click' );
        $( '[data-hook="convertToPopulationLink"]' ).off( 'click' );
        $( '[data-hook="convertToSpatialLink"]' ).off( 'click' );

        PrimaryView.prototype.remove.apply(this, arguments);
    },
    selectModel: function()
    {
        if(this.modelSelector.selected)
        {
            if(this.modelEditor)
            {
                this.modelEditor.remove()
                this.stopListening(this.selected);
                
                delete this.modelEditor;
            }
            
            this.modelEditor = new ModelEditorView( {
                el : $( '<div>' ).appendTo( this.queryByHook('editor') )[0],
                model : this.modelSelector.selected,
                meshCollection : this.meshCollection,
                parent : this
            } );

            if(this.modelSelector.selected.isSpatial)
            {
                $( '.reqNonSpatialModel' ).hide();
                $( '.reqSpatialModel' ).show();
            }
            else
            {
                $( '.reqNonSpatialModel' ).show();
                $( '.reqSpatialModel' ).hide();
            }
            
            this.listenTo(this.modelSelector.selected, 'remove', _.bind(this.modelDeleted, this));
            this.listenTo(this.modelSelector.selected, 'requestSave', _.bind(this.saveModel, this));
            this.listenTo(this.modelSelector.selected, 'change:saveState', _.bind(this.updateSaveMessage, this));
            
            this.registerSubview(this.modelEditor);
            this.modelEditor.render();

            //if($( this.el ).find('.selectAccordion .accordion-body').hasClass('in'))
            //{
            //    $( this.el ).find('.selectAccordion a').first()[0].click();
            //}

            if(!$( this.el ).find('.speciesAccordion .accordion-body').first().hasClass('in'))
                $( this.el ).find('.speciesAccordion').find('a').first()[0].click();
            if(!$( this.el ).find('.parametersAccordion .accordion-body').first().hasClass('in'))
                $( this.el ).find('.parametersAccordion').find('a').first()[0].click();
            if(!$( this.el ).find('.mesh3dAccordion .accordion-body').first().hasClass('in'))
                $( this.el ).find('.mesh3dAccordion').find('a').first()[0].click();
            if(!$( this.el ).find('.initialConditionsAccordion .accordion-body').first().hasClass('in'))
                $( this.el ).find('.initialConditionsAccordion').find('a').first()[0].click();
            if(!$( this.el ).find('.reactionsAccordion .accordion-body').first().hasClass('in'))
                $( this.el ).find('.reactionsAccordion').find('a').first()[0].click();

            // Need to remember this so we can clean up event handlers
            this.selected = this.modelSelector.selected;
        }

        this.updateModelNameText();
    },
    exportModel : function()
    {
        var saveMessageDom = $( this.queryByHook('saveMessage') );

        saveMessageDom.removeClass( "alert-success alert-error" );
        saveMessageDom.text( "Duplicating model..." );

        var models = $.ajax( { type : 'GET',
                               url : '/publicModels/names',
                               async : false,
                               dataType : 'JSON' } ).responseJSON;

        var names = models.map( function(model) { return model.name; } );

        model = new Model(this.modelSelector.selected.toJSON());

        var tmpName = model.name;
        while(_.contains(names, tmpName))
        {
            tmpName = model.name + '_' + Math.random().toString(36).substr(2, 3);
        }

        model.name = tmpName;
        model.is_public = true;
        model.id = undefined;

        model.setupMesh(this.meshCollection);

        publicModelCollection.add(model);

        saveMessageDom.text( "Saving model..." );

        model.save(undefined, {
            success : _.bind(this.modelSaved, this),
            error : _.bind(this.modelNotSaved, this)
        });
    },
    modelSaved: function() {
        var saveMessageDom = $( this.queryByHook('saveMessage') );

        saveMessageDom.removeClass( "alert-error" );
        saveMessageDom.addClass( "alert-success" );
        saveMessageDom.text( "Saved model to public library" );

        window.location = '/publicLibrary';
    },
    modelNotSaved: function()
    {
        var saveMessageDom = $( this.queryByHook('saveMessage') );

        saveMessageDom.removeClass( "alert-success" );
        saveMessageDom.addClass( "alert-error" );
        saveMessageDom.text( "Error! Model not saved to public library!" );
    },
    modelDeleted: function()
    {
        if(this.modelEditor)
        {
            this.modelEditor.remove()
            this.stopListening(this.modelSelector.selected);
            this.selected = undefined;

            delete this.modelEditor;
        }

        this.updateModelNameText();
    },
    exportModelAsZip: function()
    {
        $.ajax( { type : 'GET',
                  url : '/modeleditor',
                  data : { reqType : 'exportToZip', id : this.modelSelector.selected.id },
                  dataType : 'json',
                  success : _.bind(this.forwardToFile, this)
                } )
    },
    exportModelAsXML: function()
    {
        $.ajax( { type : 'GET',
                  url : '/modeleditor',
                  data : { reqType : 'exportToXML', id : this.modelSelector.selected.id },
                  dataType : 'json',
                  success : _.bind(this.forwardToFile, this)
                } )
    },
    exportModelAsSBML: function()
    {
        $.ajax( { type : 'GET',
                  url : '/modeleditor',
                  data : { reqType : 'exportToSBML', id : this.modelSelector.selected.id },
                  dataType : 'json',
                  success : _.bind(this.forwardToFile, this)
                } )
    },
    runSimulation: function()
    {
              window.location =  '/simulate?model_id='+this.modelSelector.selected.id
    },
    forwardToFile: function(data)
    {
        if(data.url)
        {
            window.location = data.url;
        }
        else
        {
            var saveMessageDom = $( this.queryByHook('saveMessage') );

            saveMessageDom.removeClass( "alert-success" );
            saveMessageDom.addClass( "alert-error" );
            saveMessageDom.text( data.msg );        
        }
    },
    render: function()
    {
        //View.prototype.render.apply(this, arguments);

        $( this.queryByHook('modelSelect') ).empty();

        var url = new URL(document.URL, true);

        var model;
        if(url.query.select)
        {
            model = this.collection.get(parseInt(url.query.select), "id");
        }
        else if(url.query.model_edited)
        {
            for(var i = 0; i < this.collection.models.length; i++)
            {
                if(this.collection.at(i).name == url.query.model_edited)
                {
                    model = this.collection.at(i);
                }
            }
        }

        this.modelSelector = this.renderSubview(
            new ModelSelectView( {
                collection : this.collection,
                meshCollection : this.meshCollection,
                parent : this,
                selected : model
            } ), this.queryByHook('modelSelect')
        );

        this.selectModel();
        this.modelSelector.on('change:selected', _.bind(this.selectModel, this));

        return this;
    }
});

