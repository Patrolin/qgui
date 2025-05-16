// odin build src -target="js_wasm32" -out="out/app" -no-entry-point
package main
import "core:fmt"
import "core:os"

foreign import "js"
@(default_calling_convention = "contextless")
foreign js {
	println :: proc(message: string) ---
}

@(export)
setup :: proc() {
	fmt.print("hello from Odin")
}

@(export)
render :: proc() {
	fmt.print("render")
}
