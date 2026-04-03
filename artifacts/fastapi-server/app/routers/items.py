from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

router = APIRouter(prefix="/items", tags=["items"])


class Item(BaseModel):
    id: int
    name: str
    description: str | None = None
    price: float
    in_stock: bool = True


_items: dict[int, Item] = {
    1: Item(id=1, name="Widget", description="A useful widget", price=9.99),
    2: Item(id=2, name="Gadget", description="A handy gadget", price=24.99),
}
_next_id = 3


@router.get("/", response_model=list[Item])
def list_items():
    return list(_items.values())


@router.get("/{item_id}", response_model=Item)
def get_item(item_id: int):
    if item_id not in _items:
        raise HTTPException(status_code=404, detail="Item not found")
    return _items[item_id]


@router.post("/", response_model=Item, status_code=201)
def create_item(item: Item):
    global _next_id
    item.id = _next_id
    _items[_next_id] = item
    _next_id += 1
    return item


@router.put("/{item_id}", response_model=Item)
def update_item(item_id: int, item: Item):
    if item_id not in _items:
        raise HTTPException(status_code=404, detail="Item not found")
    item.id = item_id
    _items[item_id] = item
    return item


@router.delete("/{item_id}", status_code=204)
def delete_item(item_id: int):
    if item_id not in _items:
        raise HTTPException(status_code=404, detail="Item not found")
    del _items[item_id]
