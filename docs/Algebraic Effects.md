# Algebraic Effects

Very much based off of eff-lang, but taking, like unison, the choice of making handlers "shallow" (https://www.eff-lang.org/handlers-tutorial.pdf).


## The Pitch!
Here's what is convincing:
- monadic json parser? it's encoding failure, have a `fail()` effect.
- mixing different effects (fail() and Random() when parsing json)

Is there a way to make algebraic effects /just/ syntax sugar over Tasks?


## Two-layers-deep effect variables?

Allowing something like
```ts
const twoLevelsDeep = {e}(handler: (() ={e}> string) ={}> string, handled: () ={e}> string): string => {
    handler(handled)
}
```
would require rather more fineagaling. 
which I'm not really feeling up to right now.
I have some slight ideas how it might work,
where I would have a multi-handler variable "eHandler"
that is a tuple or something.

## My "web framework" example

What should `onClick` handlers be able to do? (and `useEffect`? idk)
- setTimeout and setInterval probably
- anything else that the runtime wants to provide. like fetches, or whatever.


self-referential effects

`self` needs to only allowed once we've traversed into something
like, you can't do `type X = {y: X}`.

also `self` is only allowed in terms if we're a function. right?

ok so I need to keep track of ....

<!--
OK
so the difficult thing with effects and effect variables
EITHER
we only allow one unique instantiation of an effect in a tree
so only one handler
OR
we can't have a generic function that handles generically.
because we don't know which things to handle I don't think.

More detail on this: This code in unison introduces a runtime type error.
because the second nested handler doesn't know that the value being
requested is of a different type.

getWorld : () ->{base.Store Text} Text
getWorld = '(Store.get ++ " world")
> Store.withInitialValue "hi" '(Store.withInitialValue 10 getWorld) 

Ways we could solve this:
1. not allow multiple instantiations of the same effect in the same stack
2. have handlers include in the "registration" of themselves a hash of the relevant type variables (thereby *disallowing* handling effects polymorphically. If you don't know the concrete type, you can't `handle`. and uh you can't polymorphically throw an effect either)
3. do runtime inspection of the value being sent or requested... (I mean there's no "value" being requested so actually maybe this method just flat out wouldn't work)
4. monomorphize it all up. we don't really want to do this in javascript.

OK but honestly the simplest solution would be to disallow multiple
instantiations of the same effect in the same tree.
buuuuut do I even have the wherewithall to do that, given that
things can be effect-polymorphic?


woops https://github.com/unisonweb/unison/issues/852
yeah ok might need to rethink a couple things.


Off the cuff:
passing handlers around as extra arguments
feels like my modular implicits dealio
also the `val` effect type from koka https://koka-lang.github.io/koka/doc/book.html#sec-opfun
which is just dependency injection
um so at runtime it's another argument being passed around
like
seems like I could unify some things.
because their explanation for the dependency injection was
"it's annoying to add an extra argument, but adding an extra type is fine"
because we can infer types, but we can't infer arguments.
*but* what if we could infer arguments? which is what scala does.

so you can declare arguments as "inferred".
which means they can be explicitly provided,
but if not, they are inferred
and callers also get them.

and so each new effect handler is a new argument basically.
*but*
how to handle effect-polymorphic functions? what's the deal there?

like
hm
maybe you have to monomorphize them?
got to think about this more.




AH ok so the handlers
show up as implicit arguments
and `raise` takes the handler as an implicit argument.
the function `Store<T>.get` takes `Handler<Store<T>>`
as the final argument.
so maybe I don't really need `raise!`? Like, I can just
call the autogenerated function? I mean, I do like
having it look special.

Ok, so what about {e} functions?
that is, if effects are indicated by implicit arguments,
do we need the effect annotation as well?
I mean
hm

ok but just having the handler *available* to you (passed in as an argument) doesn't mean that you actually use it.
and you want to be able to look at the type signature and know
what things are used.

So the other thing that having nameable handlers gives you, is
the eff paper's concept of "labeling". That is, you can have multiple
handlers for the same type going on at the same time.

So do we have the concept of like effect parameters or something?

-->

```ts
(int, float) ={Store<int>, Store<float>}> float

// Labelled. Coolio
(x: int, y: int) ={storeX: Store<int>, storeY: Store<int>}> {
  (x + raise:storeX!(Store.get()), y + raise:storeY!(Store.get()))
}
```

<!--
hm that's conceivable.

but the question about {e}, does it remain?

// hm should we name the handle?
// yes, handles can be labelled.
const m = (fn: () ={x: Store<int>, y: Store<int>}> int) => {
  handle:x fn {
    ...
  }
}

Ok, so
() ={Stdio, Store<int>}> ...
becomes
(stdioHandler, storeIntHandler, done) => ...cpsified

WHAT ABOUT
map: <T, K>(arr: Array<T>, fn: (T) ={e}> K) ={e}> Array<K>

// map has the Log effect, but not explicitly
// so it doesn't need the handler
// buut
// is there a way to indicate that?
map(myArr, (x: int) ={Log}> {log(x); x + 1})
// could become
map(myArr, (x: int, done) ={Log}> {log(x, logHandler); x + 1}, done)
// but the general way is
map(myArr, (x: int, logHandler, done) => {log(x, logHandler); x + 1}, logHandler, done)
// buuut
// what if it's multiple arguments
// ayy there's the rub.
map(myArr, (x: int) ={Log, Get}> {log(x); x + get()})
// would need to be
map(myArr, (x: int, logHandler, getHandler, done) ={Log, Get}> {log(x); x + get()}, logHandler, getHandler, done)
// and that ain't it, folks. Not messing around with multiple argument lengths

ok yeah
so, when passing in a function
that uses effects
that aren't explicitly provided
*or*
that *doesn't* use effects
that are explicitly provided
we need to make an intermediate lambda


add = (x: int) ={Log, Get}> {log(x); x + get()}
map(myArr, add)
// becomes
map(myArr, (done) => add(logHandler, getHandler, done), done)
// yay so good.
// and the bonus is, we already have machiner for converting a
// pure thing to a cps one
// btw I shouldn't have that be a builtin function, because
// we can probably optimize it away in a bunch of cases.



OK BUT

I need to make sure that polymorphic effects work.

effect Please<T> {
  please: () => T,
}

const provide = <T, R>(t: T, fn: () ={Please<T>}> R): R ={}> {
  handle fn {
    Please<T>.please(() => k) => provide(t, () => k(t)),
    pure(v) => v,
  }
}

const addPlease = (x: int) ={Please<int>}> x + raise!(Please<int>.please())
const res = provide<int>(10, () => addPlease(5)) == 15

ok I guess that one's fine, but


const getInt = () ={Please<int>}> raise!(Please<int>.please())
const getFloat = () ={Please<float>}> raise!(Please<float>.please())
provide<int>(10, () => provide(5.0, () => (getInt(), getFloat())))

const getBoth = () ={Please<int>, Please<float>>}> (getInt(), getFloat())

// ok
// so this needs to be
provide<int>(10, () ={Please<int>}> provide(5.0, () ={Please<float>, Please<int>}> (getInt(), getFloat())))

// with separate function
provide<int>(10, () ={Please<int>}> provide(5.0, getBoth))

// Ok???? I think this works????
provide<int>(10, (intHandler, done) ={Please<int>}> provide(5.0, (floatHandler, done) => getBoth(intHandler, floatHandler, done)))

Things we need:
a total ordering of effects.



okk, so:
- step 1: full type information in the IR, let's not wait on that.
- step 2: change the ir stuff to do the new handler setup.




OK SO THE NEW PLAN
OF WHAT TO DO
For every function call
that is effectful

initial arguments
helloThings(10, 20, 30, handleOne, handleTwo, done)




-->



<!-- somethingX
otherY
- need to check -->



## Error handling!

It could be ~nice to have helpful error tracking through algebraic effects.

This might look like effects being [??]variant in their arguments or something.

Like you if call

x() // that has `Throws<IoErr>`
y() // that has `Throws<FsErr>`

then the resulting routine would have `Throws<IoErr | FsErr>`.

hmmmmm
would that require me to give up my 'all enums have names' rule?
I really don't want to ditch that rule.
I guess I could do editor glue here to produce a 
```ts
enum MyRoutineErr {
  ...IoErr,
  ...FsErr,
}
```
yeah that doesn't sound terrible?



## How to optimize performance of the handlers data structure?
(haha found the bug & fixed it, this is fine)

This backtracking thing is definitely a stress test 😅.

Currently I'm using an Array.

What about a linked list?

`[head, tail]` where `head` is `{hash, fn}`, and `tail` is `nil === []` or `[head, tail]`



## Editor Integration

So one thing I want to make super easy is fixture tests for all terms.
(and probably generative tests too)
this will be built-in to the editor.
When you're working with a term, you can have a sidebar open listing the inputs and the expected outputs.
also, if you just provide an input, the output will be filled in (yay jest fixtures), and you can choose to accept or reject.

So with effects, the fixture harness will allow you to specify a list of effects that you want to spoof.
OR probably you can reference one or many handlers that are already defined, that will wrap the current term n stuff.

So you have
- myCoolFn
- Fixture lists
    - handlers: x, y, z
      fixtures:
      - input: x; output: y
      - input z;  output: a
    - handlers: a, b, c
      fixtures:
      - ...

And handlers just needs to be a list of functions that handle effects. they'll be applied left to right.


