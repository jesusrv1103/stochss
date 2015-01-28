/*global app, me, $*/
var $ = require('jquery');
var _ = require('underscore');
var logger = require('andlog');
var config = require('clientconfig');

//var Router = require('./router');
//var ConvertModelView = require('./convertToSpatial/model');
var View = require('ampersand-view');
var AmpersandModel = require('ampersand-model');
var AmpersandCollection = require('ampersand-rest-collection');
var ModelEditorView = require('./forms/model');
var ModelSelectView = require('./select/model-collection');
var Model = require('./models/model');
var domReady = require('domready');
var Mesh = require('./models/mesh');
var MeshCollection = require('./models/mesh-collection');
var MeshSelectView = require('./forms/mesh-collection');

/*var model2 = new Model({ name : "amodel",
                    units : "population",
                    type : "massaction",
                    isSpatial : false });

var A = model2.species.addSpecie("A", 500);
var B = model2.species.addSpecie("B", 500);
//var C = model.species.addSpecie("B", 500);

var k = model2.parameters.addParameter("k", "500");
var l = model2.parameters.addParameter("k", "500");
var k2 = model2.parameters.addParameter("k2", "k * k");

//console.log(A.inUse);

//model.species.on('change:stoich-specie', function() { console.log('reactionchanged'); });

model2.reactions.addMassActionReaction('R1', k, [[A, 2]], [[B, 5]]);
model2.reactions.addMassActionReaction('R2', k2, [[B, 1], [A, 1]], [[B, 5]]);
//model.reactions.addCustomReaction('R2', 'k * k2', [[A, 2], [B, 2]], [[B, 5]]);

model = new Model(model2.toJSON());*/

var PrimaryView = View.extend({
    template: "<div> \
<div class='well' data-hook='selector'></div> \
<div class='well' data-hook='editor'></div> \
</div>",
    initialize: function(attr, options)
    {
        View.prototype.initialize.call(this, attr, options);

        this.meshCollection = attr.meshCollection;
    },
    selectModel: function()
    {
        if(this.modelSelector.selected)
        {
            if(this.modelEditor)
            {
                this.modelEditor.remove()
                this.stopListening(this.modelSelector.selected);
                
                delete this.modelEditor;
            }
            
            this.modelEditor = new ModelEditorView( {
                el : $( '<div>' ).appendTo( this.queryByHook('editor') )[0],
                model : this.modelSelector.selected,
                meshCollection : this.meshCollection,
                parent : this
            } );
            
            this.listenTo(this.modelSelector.selected, 'remove', _.bind(this.modelDeleted, this));
            this.registerSubview(this.modelEditor);
            this.modelEditor.render();
        }
    },
    modelDeleted: function()
    {
        if(this.modelEditor)
        {
            this.modelEditor.remove()
            this.stopListening(this.modelSelector.selected);
            
            delete this.modelEditor;
        }
    },
    render: function()
    {
        View.prototype.render.apply(this, arguments);

        this.modelSelector = this.renderSubview(
            new ModelSelectView( {
                collection : this.collection,
                meshCollection : this.meshCollection
            } ), $( '<div>' ).appendTo( this.queryByHook('selector') )[0]
        );

        this.selectModel();
        this.modelSelector.on('change:selected', _.bind(this.selectModel, this));

        return this;
    }
});

ModelCollection = AmpersandCollection.extend( {
    url: "/models",
    model: Model
});

MeshCollection = AmpersandCollection.extend( {
    url: "/meshes",
    model: Mesh
});

var modelCollection = new ModelCollection();
var meshCollection = new MeshCollection();

var modelDownloaded = false; var meshDownloaded = false;

modelCollection.fetch({
    success : function(modelCollection, response, options)
    {
        modelDownloaded = true;
        if(meshDownloaded)
        {
            module.exports.blastoff();
        }
    }
});

meshCollection.fetch({
    success : function(meshCollection, response, options)
    {
        meshDownloaded = true;
        if(modelDownloaded)
        {
            module.exports.blastoff();
        }
    }
});

module.exports = {
    blastoff: function () {
        var self = window.app = this;

        var div = $( '#modelSelect' )[0];

        if(!div)
            div = document.body;

        domReady(function () {
            for(var i = 0; i < modelCollection.models.length; i++)
            {
                modelCollection.models[i].setupMesh(meshCollection);
            }

            var modelSelectView = new PrimaryView( { el: div, collection : modelCollection, meshCollection : meshCollection } );

            modelSelectView.render();
            //var meshSelectView = new MeshSelectView( { el: div, collection : meshCollection } );

            //meshSelectView.render();
        });
    }
};

