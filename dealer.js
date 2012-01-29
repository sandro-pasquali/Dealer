"use strict";

//  TODO: compress when duds exceed some threshold
//
(function() {

var BINDING = {
	original 	: {},
	active		: {},
	indexes		: [],
	duds		: []
};

var ORIGINAL 	= BINDING.original;
var ACTIVE		= BINDING.active;
var INDEXES 	= BINDING.indexes);
var DUDS		= BINDING.duds;

//  A library of common methods
//  
var $$ = {
    isArray     : function(a) {
        return Object.prototype.toString.call(a) === '[object Array]';
    },
    argsToArray : function(a, offset, end) {
        return Array.prototype.slice(a, offset || 0, end);
    },
    objToArray  : function(o, vals) {
        var p;
        var r = [];
    
        for(p in o) {
            if(vals) {
                r[o[p]] = p;
            } else {
                r.push(p);
            }
        }
    
        return r;
    },
    arrayToObj  : function(a) {
        var len = a.length;
        var ob 	= {};
    
        while(len--) {
            ob[a[len]] = len;
        }
    
        return ob;
    },
    copy        : function(s) {
        return s.slice(0);
    }
};

//	These set methods only return a value if their operation is non-destructive.
//	The current operating set is passed by reference, and as such does not need
//	to be returned.
//
var METHODS = {

	//	##add
	//
    //  Add a member to the set. If the set does not exist, it is created (with #a added).
    //
    add     : function(cur, idx, a, len, key, duds) {

    	var cnt = 0;
    	var d;
		var m;

        while(a.length) {
            m = a.shift();
			if(typeof m !== "object" && !cur.hasOwnProperty(m)) {
			    d = duds.shift();
			    if(d !== void 0) {
			        idx[d] = m;
			        cur[m] = d;
			    } else {
                    idx.push(m);
                    cur[m] = idx.length -1;
                }
				++cnt;
			}
        }

        return cnt;
    },

	//	##size
	//
	//	The number of members in #cur.
	//
	//	@return		{Number}
	//
    size    : function(cur, idx, a, len, key, duds) {
        return len - duds.length;
    },

	//	##has
	//
	//	If #cur has #a member.
	//
	//	@return		{Boolean}
	//
    has     : function(cur, idx, a, len) {
        return cur.hasOwnProperty(a[0]);
    },

	//	##members
	//
	//	Return all members of a #cur.
	//
	//	@return		{Array}
	//
    members : function(cur, idx, a, len, key, duds) {
        var m = $$.copy(idx);
        var d = duds.length;

        while(d--) {
            m.splice(duds[d], 1);
        }

        return m;
    },

	//	##commit
	//
    //	Will replace the #original set with the current #active set.
    //
    commit	: function(cur, idx, a, len, key) {
    	ORIGINAL[key] = $$.copy(ACTIVE[key]);
    },

	//	##reset
	//
    //	Will replace the #active set with the #original set.
    //
    reset	: function(cur, idx, a, len, key) {
    	ACTIVE[key] = $$.copy(ORIGINAL[key]);
    },

	//	##pluck
	//
	//	Remove a random member from #cur. Returns success of operation.
	//
	//	@return	{Boolean}
	//
    pluck   : function(cur, idx, a, len) {
        var rm = Math.floor(Math.random() * len);
        return this.remove(cur, idx, [rm])[0];
    },

	//	##remove
	//
	//	Remove members #a from #cur. Returns an array of removed members, not
	//	including non-existent members.
	//
	//	@return 	{Array}
	//
    remove  : function(cur, idx, a, len, key, duds) {
		var c = [];
        var m;
        var i;

        while(m = a.shift()) {
            if(cur.hasOwnProperty(m)) {
                i = cur[m];
                delete cur[m];
                idx[i] = null;
                duds.push(i);
                c.push(m);
            }
        }

        if(duds.length > 100) {
            //... compress
        }

        return c;
    },

	//	##union
	//
	//	Union of all sets (add unique members of all sets).
	//
	//	@see	#SET_ACCESSOR
	//	@return	{Array}
	//
    union  : function(cur, idx, a) {

		a.push(idx);

        var map		= {};
        var s;
        var si;
        var k;

        while(k = a.shift()) {
            //  Keys(sets) which do not exist are considered to be empty sets.
            //
            s 	= $$.isArray(k) ? k : INDEXES[k] || [];
            si	= s.length;
            while(si--) {
            	map[s[si]] = 1;
            }
        }

		return $$.objToArray(map);
    },

	//	##diff
	//
	//	Difference between first set (#prime) and subsequent sets (members of #prime
	//	set which do not exist in any other set).
	//
	//	@see	#SET_ACCESSOR
	//	@return	{Array}
	//
    diff   : function(cur, idx, a) {
        var prime 	= $$.copy(cur);
        var s;
        var si;
        var k;

        while(k = a.shift()) {
            //  Keys(sets) which do not exist are considered to be empty sets.
            //
            s 	= INDEXES[k] || [];
            si	= s.length;
            while(si--) {
                if(prime.hasOwnProperty(s[si])) {
                	delete prime[s[si]];
                }
            }
        }

        return $$.objToArray(prime);
    },

	//	##intersect
	//
	//	Intersection of all sets (members which exist in all sets).
	//
	//	@see	#SET_ACCESSOR
	//	@return	{Array}
	//
    intersect   : function(cur, idx, a, len, key) {

        //  See notes in #SET_ACCESSOR re: #intersect.
        //	#key may be either a {String} or an {Array}, in the first case because
        //	the caller requested an existing set index, in the second because
        //	the caller sent a "raw" set (array). Regardless, we need to add #key to the
        //	argument list.
        //
        a.push(key);

        var aL  = a.length;
        var map = {};
        var res = [];
        var k;
        var s;
        var si;

        while(k = a.shift()) {
            //  Keys(sets) which do not exist are considered to be empty sets.
            //  Intersection with an empty set always produces an empty set.
            //
            s 	= $$.isArray(k) ? k : (INDEXES[k] || []);
            si 	= s.length;
            while(si--) {
                if((map[s[si]] = map[s[si]] ? map[s[si]] += 1 : 1) === aL) {
                    res.push(s[si]);
                }
            }
        }

        return res;
    }
};

//	##SET_ACCESSOR
//
//  Prefilter for set calls, mainly to validate arguments and set up boilerplate for
//  the set accessors to use.
//
//  Ensures that execution terminates if requested method cannot work with the
//  current set, determines current set values, filters argument list, and calls method.
//
var SET_ACCESSOR = function(m, key) {
    var a   	= $$.argsToArray(arguments, 2);
	var cur 	= ACTIVE[key];
	var si		= INDEXES[key];
	var duds	= DUDS[key];
	var initial	= false;
	var result;

    //  There is no set at #key.
    //
    //  #add creates a set if none exists and continue.
    //
    //	#intersect accepts non-existent sets as arguments. These are converted into
    //	empty sets. As intersection of sets with an empty set is always an empty
    //	set, just return an empty set. NOTE: An empty set is not *created* in the
    //	#BINDING collection. #intersect also accepts a "raw" array as a key -- so you
    //	may send $.sets.intersect([1,2,3], "setKey", "another");
    //
    //	#diff accepts non-existent sets as arguments. If #key is undefined, then
    //	#cur is set to an empty set.  NOTE: An empty set is not *created* in the #BINDING
    //	collection -- #cur is simply set to an empty object. #diff also accepts a "raw" array
    //	as a key -- so you may send $.sets.diff([1,2,3], "setKey", "another");
    //
    //	#union accepts non-existent sets as arguments. If #key is undefined, then
    //	#si is set to an empty set.  NOTE: An empty set is not *created* in the #BINDING
    //	collection -- #si is simply set to an empty object. #union also accepts a "raw" array
    //	as a key -- so you may send $.sets.union([1,2,3], "setKey", "another");
    //
    //  All other methods return undefined.
    //
    if(!cur) {
        if(a[0] !== void 0 && m == "add") {
        	cur 	= ACTIVE[key] 	= {};
        	si 		= INDEXES[key] 	= [];
        	duds	= DUDS[key] 	= [];
            initial = true;
		} else if(m == "intersect") {
			if(!$$.isArray(key)) {
				return [];
			}
		} else if(m == "diff") {
			cur = {};
			if($$.isArray(key)) {
				cur = $$.arrayToObj(key);
			}
        } else if(m == "union") {
			si = [];
			if($$.isArray(key)) {
				si = key;
			}
        } else {
            return void 0;
        }
    }

	//	Run transformation on #active set.
	//
    result = METHODS[m](cur, si, a, si && si.length, key, duds);

	//	If first set operation on this key, store *copy* of #active.  NOTE that the
	//	copy is shallow, which means that objects are not copied. Being in a set
	//	doesn't insulate set members from external access which may, or may not, be
	//	what you want.
	//
	if(initial) {
		ORIGINAL[key] = $$.copy(cur);
	}

   	return result || cur;
};

var SET_M = [
    "add",
    "size",
    "has",
    "members",
    "pluck",
    "remove",
    "intersect",
    "diff",
    "union",
    "reset",
    "commit"
];

var KIT = {};

while(SET_M.length) {
	(function(m) {
		KIT[m] = function(ob) {

			//	Methods have varying functional signatures.
			//
		    var a = $$.argsToArray(arguments);

			//	#LIST_ACCESSOR expects method name as first argument.
			//
            a.unshift(m);

			return SET_ACCESSOR.apply(KIT, a);
		};
	})(SET_M.pop());
}

if(typeof exports == 'object' && exports) {
    exports.dealer = KIT;
} else {
    window.dealer = KIT;
}

})();