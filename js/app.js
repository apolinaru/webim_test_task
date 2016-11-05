$(function(){

VK.init({
	apiId: 5707332
});

var AppState = Backbone.Model.extend({
    defaults: {
        state: "auth",
        first_name: "",
        last_name: "",
        photo_max: "placeholder.png"
    }
});

var appState = new AppState();

var FriendModel = Backbone.Model.extend({ 
    defaults: {
        "photo_100": "placeholder.png"
    }
});

var FriendList = Backbone.Collection.extend({

    model: FriendModel

});

var WrapperView = Backbone.View.extend({
    el: $("#wrapper"), 
    templates: {
    	"auth": _.template($('#auth').html()),
    	"app": _.template($('#app').html())
    },
    events: {
        "click .bb_auth": "check",
        "click .bb_reload": "reload",
        "click .bb_logout": "logout",
    },
    initialize: function () { 
        this.model.bind('change', this.render, this);
  		VK.Api.call('users.get', {fields: "photo_max"}, function(r) {
			if(r.response) {
            	appState.set({ 
            		state: "app",
            		first_name: r.response[0].first_name,
            		last_name: r.response[0].last_name,
            		photo_max: r.response[0].photo_max
            	});
			}
		});
    },
    check: function () {
        VK.Auth.login(function() {
  			VK.Api.call('users.get', {fields: "photo_max"}, function(r) {
				if(r.response) {
        	    	appState.set({ 
            			state: "app",
            			first_name: r.response[0].first_name,
            			last_name: r.response[0].last_name,
            			photo_max: r.response[0].photo_max
            		});
				}
			});
		}, 2);
    },
    render: function () {
    	var state = this.model.get("state");
    	$(this.el).html(this.templates[state](this.model.toJSON()));
    	this.reload();
    	return this;
    },
    reload: function() {
    	VK.Api.call('friends.get', {order:'random', count:5, name_case:'nom', fields:'name,photo_100'}, function(r) {
  			var friends_list = r.response;
  			var friend_list = new FriendListView(friends_list);
		});
    },
    logout: function() {
    	VK.Auth.logout();
        appState.set({ state: "auth" });
    }
});

var FriendView = Backbone.View.extend({
    tagName: "div",
    className: "friend",
    template: $("#friend").html(),

    render: function () {
        var tmpl = _.template(this.template);
        
        $(this.el).html(tmpl(this.model.toJSON()));
        return this;
    }
});

var FriendListView = Backbone.View.extend({
    initialize: function (options) {
    	this.options = options;
        this.collection = new FriendList(options);
        this.render();
    },

    render: function () {
    	$(".friends_list").html("");
        var that = this;
        _.each(this.collection.models, function (item) {
            that.renderFriend(item);
        }, this);
    },

    renderFriend: function (item) {
        var friendView = new FriendView({
            model: item
        });
        $(".friends_list").append(friendView.render().el);
    }
});

var Controller = Backbone.Router.extend({
    routes: {
        "!/": "auth", 
        "!/app": "app",
        "!/err": "error"
    },

    initialize: function () {
    	$('body').delegate('a[href]:not([href="#"])', 'click', function (e) {
    		e.preventDefault();
    		that.navigate($(this).attr('href'), {trigger: true});
    	});
    },

    auth: function () {
    	appState.set({ state: "auth" });
    },

    app: function () {
    	if (appState.get("state") == "app") {
	    	appState.set({ state: "app" });
	    }
    },

    error: function () {
    	console.log('err');
    }
});

var controller = new Controller(); 

var wrapper = new WrapperView({ model: appState });

appState.trigger("change");

appState.bind("change:state", function () { 
    var state = this.get("state");
    if (state == "auth")
        controller.navigate("!/", false); 
                                          
    else
        controller.navigate("!/" + state, false);
});

Backbone.history.start();

});