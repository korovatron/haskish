fst (a, _) = a
snd (_, b) = b

sum xs = fold (+) 0 xs
product xs = fold (*) 1 xs

concat [] = []
concat (xs:xss) = xs ++ concat xss

concatMap f xs = concat (map f xs)

any p [] = False
any p (x:xs) = p x || any p xs

all p [] = True
all p (x:xs) = p x && all p xs

elem _ [] = False
elem y (x:xs) = (x == y) || elem y xs

notElem y xs = not (elem y xs)

lookup key [] = error "lookup: key not found"
lookup key ((k,v):xs) =
  if key == k then v else lookup key xs

zip [] _ = []
zip _ [] = []
zip (x:xs) (y:ys) = (x,y) : zip xs ys

zipWith f [] _ = []
zipWith f _ [] = []
zipWith f (x:xs) (y:ys) = f x y : zipWith f xs ys

takeWhile p [] = []
takeWhile p (x:xs) =
  if p x then x : takeWhile p xs else []

dropWhile p [] = []
dropWhile p (x:xs) =
  if p x then dropWhile p xs else x:xs
