
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.head.appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function empty() {
        return text('');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function prevent_default(fn) {
        return function (event) {
            event.preventDefault();
            // @ts-ignore
            return fn.call(this, event);
        };
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function set_input_value(input, value) {
        if (value != null || input.value) {
            input.value = value;
        }
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error(`Function called outside component initialization`);
        return current_component;
    }
    function onMount(fn) {
        get_current_component().$$.on_mount.push(fn);
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    const seen_callbacks = new Set();
    function flush() {
        do {
            // first, call beforeUpdate functions
            // and update components
            while (dirty_components.length) {
                const component = dirty_components.shift();
                set_current_component(component);
                update(component.$$);
            }
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    const globals = (typeof window !== 'undefined' ? window : global);
    function create_component(block) {
        block && block.c();
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if ($$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(children(options.target));
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set() {
            // overridden by instance, if it has props
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.18.1' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev("SvelteDOMInsert", { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev("SvelteDOMInsert", { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev("SvelteDOMRemove", { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ["capture"] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev("SvelteDOMAddEventListener", { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev("SvelteDOMRemoveEventListener", { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev("SvelteDOMRemoveAttribute", { node, attribute });
        else
            dispatch_dev("SvelteDOMSetAttribute", { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.data === data)
            return;
        dispatch_dev("SvelteDOMSetData", { node: text, data });
        text.data = data;
    }
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error(`'target' is a required option`);
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn(`Component was already destroyed`); // eslint-disable-line no-console
            };
        }
    }

    /* src/Schema.svelte generated by Svelte v3.18.1 */

    const { console: console_1 } = globals;
    const file = "src/Schema.svelte";

    // (99:14) {#if isEdit === false}
    function create_if_block(ctx) {
    	let button;
    	let dispose;

    	const block = {
    		c: function create() {
    			button = element("button");
    			button.textContent = "Add Participant";
    			attr_dev(button, "type", "submit");
    			attr_dev(button, "class", "btn btn-primary");
    			add_location(button, file, 99, 16, 2285);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, button, anchor);
    			dispose = listen_dev(button, "click", prevent_default(/*addParticipant*/ ctx[2]), false, true, false);
    		},
    		p: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(button);
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block.name,
    		type: "if",
    		source: "(99:14) {#if isEdit === false}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let article;
    	let h10;
    	let t0;
    	let t1_value = /*schema*/ ctx[0].study_subject_id + "";
    	let t1;
    	let t2;
    	let small0;
    	let t3;
    	let b0;
    	let t4_value = /*schema*/ ctx[0].label + "";
    	let t4;
    	let t5;
    	let br0;
    	let t6;
    	let small1;
    	let t7;
    	let b1;
    	let t8_value = /*schema*/ ctx[0].study_id + "";
    	let t8;
    	let t9;
    	let br1;
    	let t10;
    	let section;
    	let div6;
    	let div5;
    	let div4;
    	let div3;
    	let div2;
    	let h11;
    	let t12;
    	let form;
    	let div0;
    	let label0;
    	let t14;
    	let input0;
    	let t15;
    	let div1;
    	let label1;
    	let t17;
    	let input1;
    	let t18;
    	let dispose;
    	let if_block = /*isEdit*/ ctx[1] === false && create_if_block(ctx);

    	const block = {
    		c: function create() {
    			article = element("article");
    			h10 = element("h1");
    			t0 = text("study_subject_id = ");
    			t1 = text(t1_value);
    			t2 = space();
    			small0 = element("small");
    			t3 = text("Label :\n    ");
    			b0 = element("b");
    			t4 = text(t4_value);
    			t5 = space();
    			br0 = element("br");
    			t6 = space();
    			small1 = element("small");
    			t7 = text("study_id :\n    ");
    			b1 = element("b");
    			t8 = text(t8_value);
    			t9 = space();
    			br1 = element("br");
    			t10 = space();
    			section = element("section");
    			div6 = element("div");
    			div5 = element("div");
    			div4 = element("div");
    			div3 = element("div");
    			div2 = element("div");
    			h11 = element("h1");
    			h11.textContent = "Add New Participant";
    			t12 = space();
    			form = element("form");
    			div0 = element("div");
    			label0 = element("label");
    			label0.textContent = "label";
    			t14 = space();
    			input0 = element("input");
    			t15 = space();
    			div1 = element("div");
    			label1 = element("label");
    			label1.textContent = "study_id";
    			t17 = space();
    			input1 = element("input");
    			t18 = space();
    			if (if_block) if_block.c();
    			attr_dev(h10, "class", "svelte-1svv8z8");
    			add_location(h10, file, 48, 2, 796);
    			add_location(b0, file, 51, 4, 876);
    			add_location(small0, file, 49, 2, 852);
    			add_location(br0, file, 53, 2, 911);
    			add_location(b1, file, 56, 4, 947);
    			add_location(small1, file, 54, 2, 920);
    			add_location(br1, file, 58, 2, 985);
    			attr_dev(article, "class", "svelte-1svv8z8");
    			add_location(article, file, 47, 0, 784);
    			attr_dev(h11, "class", "card-title mb-4 svelte-1svv8z8");
    			add_location(h11, file, 67, 12, 1181);
    			attr_dev(label0, "for", "title");
    			add_location(label0, file, 70, 16, 1308);
    			attr_dev(input0, "type", "text");
    			attr_dev(input0, "class", "form-control");
    			attr_dev(input0, "id", "text");
    			attr_dev(input0, "placeholder", "label");
    			add_location(input0, file, 71, 16, 1357);
    			attr_dev(div0, "class", "form-group");
    			add_location(div0, file, 69, 14, 1267);
    			attr_dev(label1, "for", "category");
    			add_location(label1, file, 80, 16, 1623);
    			attr_dev(input1, "type", "text");
    			attr_dev(input1, "class", "form-control");
    			attr_dev(input1, "id", "text");
    			attr_dev(input1, "placeholder", "study_id");
    			add_location(input1, file, 81, 16, 1678);
    			attr_dev(div1, "class", "form-group");
    			add_location(div1, file, 79, 14, 1582);
    			add_location(form, file, 68, 12, 1246);
    			attr_dev(div2, "class", "card-body");
    			add_location(div2, file, 66, 10, 1145);
    			attr_dev(div3, "class", "card p-2 shadow");
    			add_location(div3, file, 65, 8, 1105);
    			attr_dev(div4, "class", "col-md-6");
    			add_location(div4, file, 64, 6, 1074);
    			attr_dev(div5, "class", "row mt-5 ");
    			add_location(div5, file, 63, 4, 1044);
    			attr_dev(div6, "class", "container");
    			add_location(div6, file, 62, 2, 1016);
    			add_location(section, file, 61, 0, 1004);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, article, anchor);
    			append_dev(article, h10);
    			append_dev(h10, t0);
    			append_dev(h10, t1);
    			append_dev(article, t2);
    			append_dev(article, small0);
    			append_dev(small0, t3);
    			append_dev(small0, b0);
    			append_dev(b0, t4);
    			append_dev(article, t5);
    			append_dev(article, br0);
    			append_dev(article, t6);
    			append_dev(article, small1);
    			append_dev(small1, t7);
    			append_dev(small1, b1);
    			append_dev(b1, t8);
    			append_dev(article, t9);
    			append_dev(article, br1);
    			insert_dev(target, t10, anchor);
    			insert_dev(target, section, anchor);
    			append_dev(section, div6);
    			append_dev(div6, div5);
    			append_dev(div5, div4);
    			append_dev(div4, div3);
    			append_dev(div3, div2);
    			append_dev(div2, h11);
    			append_dev(div2, t12);
    			append_dev(div2, form);
    			append_dev(form, div0);
    			append_dev(div0, label0);
    			append_dev(div0, t14);
    			append_dev(div0, input0);
    			set_input_value(input0, /*schema*/ ctx[0].label);
    			append_dev(form, t15);
    			append_dev(form, div1);
    			append_dev(div1, label1);
    			append_dev(div1, t17);
    			append_dev(div1, input1);
    			set_input_value(input1, /*schema*/ ctx[0].study_id);
    			append_dev(form, t18);
    			if (if_block) if_block.m(form, null);

    			dispose = [
    				listen_dev(input0, "input", /*input0_input_handler*/ ctx[4]),
    				listen_dev(input1, "input", /*input1_input_handler*/ ctx[5])
    			];
    		},
    		p: function update(ctx, [dirty]) {
    			if (dirty & /*schema*/ 1 && t1_value !== (t1_value = /*schema*/ ctx[0].study_subject_id + "")) set_data_dev(t1, t1_value);
    			if (dirty & /*schema*/ 1 && t4_value !== (t4_value = /*schema*/ ctx[0].label + "")) set_data_dev(t4, t4_value);
    			if (dirty & /*schema*/ 1 && t8_value !== (t8_value = /*schema*/ ctx[0].study_id + "")) set_data_dev(t8, t8_value);

    			if (dirty & /*schema*/ 1 && input0.value !== /*schema*/ ctx[0].label) {
    				set_input_value(input0, /*schema*/ ctx[0].label);
    			}

    			if (dirty & /*schema*/ 1 && input1.value !== /*schema*/ ctx[0].study_id) {
    				set_input_value(input1, /*schema*/ ctx[0].study_id);
    			}

    			if (/*isEdit*/ ctx[1] === false) {
    				if (if_block) {
    					if_block.p(ctx, dirty);
    				} else {
    					if_block = create_if_block(ctx);
    					if_block.c();
    					if_block.m(form, null);
    				}
    			} else if (if_block) {
    				if_block.d(1);
    				if_block = null;
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(article);
    			if (detaching) detach_dev(t10);
    			if (detaching) detach_dev(section);
    			if (if_block) if_block.d();
    			run_all(dispose);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { schema } = $$props;
    	console.log(schema);

    	let addParticipant = () => {
    		const newParticipant = {
    			study_subject_id: schema.length + 1,
    			label: schema.label,
    			study_id: schema.study_id
    		};

    		$$invalidate(0, schema = schema.concat(addParticipant));

    		$$invalidate(0, schema = {
    			study_subject_id: null,
    			label: "",
    			study_id: ""
    		});
    	};

    	let isEdit = false;

    	let editParticipant = schema => {
    		$$invalidate(1, isEdit = true);
    		data = schema;
    	};

    	const writable_props = ["schema"];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console_1.warn(`<Schema> was created with unknown prop '${key}'`);
    	});

    	function input0_input_handler() {
    		schema.label = this.value;
    		$$invalidate(0, schema);
    	}

    	function input1_input_handler() {
    		schema.study_id = this.value;
    		$$invalidate(0, schema);
    	}

    	$$self.$set = $$props => {
    		if ("schema" in $$props) $$invalidate(0, schema = $$props.schema);
    	};

    	$$self.$capture_state = () => {
    		return {
    			schema,
    			addParticipant,
    			isEdit,
    			editParticipant
    		};
    	};

    	$$self.$inject_state = $$props => {
    		if ("schema" in $$props) $$invalidate(0, schema = $$props.schema);
    		if ("addParticipant" in $$props) $$invalidate(2, addParticipant = $$props.addParticipant);
    		if ("isEdit" in $$props) $$invalidate(1, isEdit = $$props.isEdit);
    		if ("editParticipant" in $$props) editParticipant = $$props.editParticipant;
    	};

    	return [
    		schema,
    		isEdit,
    		addParticipant,
    		editParticipant,
    		input0_input_handler,
    		input1_input_handler
    	];
    }

    class Schema extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, { schema: 0 });

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Schema",
    			options,
    			id: create_fragment.name
    		});

    		const { ctx } = this.$$;
    		const props = options.props || {};

    		if (/*schema*/ ctx[0] === undefined && !("schema" in props)) {
    			console_1.warn("<Schema> was created without expected prop 'schema'");
    		}
    	}

    	get schema() {
    		throw new Error("<Schema>: Props cannot be read directly from the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}

    	set schema(value) {
    		throw new Error("<Schema>: Props cannot be set directly on the component instance unless compiling with 'accessors: true' or '<svelte:options accessors/>'");
    	}
    }

    /* src/Schemas.svelte generated by Svelte v3.18.1 */
    const file$1 = "src/Schemas.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[1] = list[i];
    	return child_ctx;
    }

    // (44:0) {:else}
    function create_else_block(ctx) {
    	let p;

    	const block = {
    		c: function create() {
    			p = element("p");
    			p.textContent = "loading...";
    			attr_dev(p, "class", "loading svelte-1vfsuii");
    			add_location(p, file$1, 44, 1, 670);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, p, anchor);
    		},
    		p: noop,
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(p);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_else_block.name,
    		type: "else",
    		source: "(44:0) {:else}",
    		ctx
    	});

    	return block;
    }

    // (35:0) {#if schemas}
    function create_if_block$1(ctx) {
    	let each_1_anchor;
    	let current;
    	let each_value = /*schemas*/ ctx[0];
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const out = i => transition_out(each_blocks[i], 1, 1, () => {
    		each_blocks[i] = null;
    	});

    	const block = {
    		c: function create() {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			each_1_anchor = empty();
    		},
    		m: function mount(target, anchor) {
    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(target, anchor);
    			}

    			insert_dev(target, each_1_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*schemas*/ 1) {
    				each_value = /*schemas*/ ctx[0];
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    						transition_in(each_blocks[i], 1);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						transition_in(each_blocks[i], 1);
    						each_blocks[i].m(each_1_anchor.parentNode, each_1_anchor);
    					}
    				}

    				group_outros();

    				for (i = each_value.length; i < each_blocks.length; i += 1) {
    					out(i);
    				}

    				check_outros();
    			}
    		},
    		i: function intro(local) {
    			if (current) return;

    			for (let i = 0; i < each_value.length; i += 1) {
    				transition_in(each_blocks[i]);
    			}

    			current = true;
    		},
    		o: function outro(local) {
    			each_blocks = each_blocks.filter(Boolean);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				transition_out(each_blocks[i]);
    			}

    			current = false;
    		},
    		d: function destroy(detaching) {
    			destroy_each(each_blocks, detaching);
    			if (detaching) detach_dev(each_1_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_if_block$1.name,
    		type: "if",
    		source: "(35:0) {#if schemas}",
    		ctx
    	});

    	return block;
    }

    // (36:1) {#each schemas as schema }
    function create_each_block(ctx) {
    	let ul;
    	let li;
    	let t;
    	let current;

    	const schema = new Schema({
    			props: { schema: /*schema*/ ctx[1] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			ul = element("ul");
    			li = element("li");
    			create_component(schema.$$.fragment);
    			t = space();
    			attr_dev(li, "class", "svelte-1vfsuii");
    			add_location(li, file$1, 37, 3, 603);
    			add_location(ul, file$1, 36, 2, 595);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, ul, anchor);
    			append_dev(ul, li);
    			mount_component(schema, li, null);
    			append_dev(ul, t);
    			current = true;
    		},
    		p: function update(ctx, dirty) {
    			const schema_changes = {};
    			if (dirty & /*schemas*/ 1) schema_changes.schema = /*schema*/ ctx[1];
    			schema.$set(schema_changes);
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(schema.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(schema.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(ul);
    			destroy_component(schema);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(36:1) {#each schemas as schema }",
    		ctx
    	});

    	return block;
    }

    function create_fragment$1(ctx) {
    	let current_block_type_index;
    	let if_block;
    	let if_block_anchor;
    	let current;
    	const if_block_creators = [create_if_block$1, create_else_block];
    	const if_blocks = [];

    	function select_block_type(ctx, dirty) {
    		if (/*schemas*/ ctx[0]) return 0;
    		return 1;
    	}

    	current_block_type_index = select_block_type(ctx);
    	if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);

    	const block = {
    		c: function create() {
    			if_block.c();
    			if_block_anchor = empty();
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			if_blocks[current_block_type_index].m(target, anchor);
    			insert_dev(target, if_block_anchor, anchor);
    			current = true;
    		},
    		p: function update(ctx, [dirty]) {
    			let previous_block_index = current_block_type_index;
    			current_block_type_index = select_block_type(ctx);

    			if (current_block_type_index === previous_block_index) {
    				if_blocks[current_block_type_index].p(ctx, dirty);
    			} else {
    				group_outros();

    				transition_out(if_blocks[previous_block_index], 1, 1, () => {
    					if_blocks[previous_block_index] = null;
    				});

    				check_outros();
    				if_block = if_blocks[current_block_type_index];

    				if (!if_block) {
    					if_block = if_blocks[current_block_type_index] = if_block_creators[current_block_type_index](ctx);
    					if_block.c();
    				}

    				transition_in(if_block, 1);
    				if_block.m(if_block_anchor.parentNode, if_block_anchor);
    			}
    		},
    		i: function intro(local) {
    			if (current) return;
    			transition_in(if_block);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(if_block);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if_blocks[current_block_type_index].d(detaching);
    			if (detaching) detach_dev(if_block_anchor);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$1.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$1($$self, $$props, $$invalidate) {
    	let schemas;

    	onMount(async () => {
    		// await fetch(`http://0.0.0.0:3010/openclinica/s_02052020test`)
    		await fetch(`http://0.0.0.0:3010/openclinica/s_02052020test/study_subject`).then(r => r.json()).then(data => {
    			$$invalidate(0, schemas = data);
    		});
    	});

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("schemas" in $$props) $$invalidate(0, schemas = $$props.schemas);
    	};

    	return [schemas];
    }

    class Schemas extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$1, create_fragment$1, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "Schemas",
    			options,
    			id: create_fragment$1.name
    		});
    	}
    }

    /* src/App.svelte generated by Svelte v3.18.1 */
    const file$2 = "src/App.svelte";

    function create_fragment$2(ctx) {
    	let t0;
    	let h1;
    	let t2;
    	let main;
    	let current;

    	const schemas_1 = new Schemas({
    			props: { schemas: /*schemas*/ ctx[0] },
    			$$inline: true
    		});

    	const block = {
    		c: function create() {
    			t0 = space();
    			h1 = element("h1");
    			h1.textContent = "The Open Clinica Svelte App";
    			t2 = space();
    			main = element("main");
    			create_component(schemas_1.$$.fragment);
    			document.title = "Svelte Open Clinica";
    			attr_dev(h1, "class", "svelte-8w03x1");
    			add_location(h1, file$2, 26, 2, 352);
    			attr_dev(main, "class", "svelte-8w03x1");
    			add_location(main, file$2, 27, 0, 389);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, t0, anchor);
    			insert_dev(target, h1, anchor);
    			insert_dev(target, t2, anchor);
    			insert_dev(target, main, anchor);
    			mount_component(schemas_1, main, null);
    			current = true;
    		},
    		p: noop,
    		i: function intro(local) {
    			if (current) return;
    			transition_in(schemas_1.$$.fragment, local);
    			current = true;
    		},
    		o: function outro(local) {
    			transition_out(schemas_1.$$.fragment, local);
    			current = false;
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(t0);
    			if (detaching) detach_dev(h1);
    			if (detaching) detach_dev(t2);
    			if (detaching) detach_dev(main);
    			destroy_component(schemas_1);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment$2.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance$2($$self) {
    	let schemas;
    	let schema;

    	$$self.$capture_state = () => {
    		return {};
    	};

    	$$self.$inject_state = $$props => {
    		if ("schemas" in $$props) $$invalidate(0, schemas = $$props.schemas);
    		if ("schema" in $$props) schema = $$props.schema;
    	};

    	return [schemas];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance$2, create_fragment$2, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment$2.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    	props: {
    		name: 'world'
    	}
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
