a = int(input("Primer número: "))
b = int(input("Segundo número: "))
c = int(input("Tercer número: "))

if a <= b and a <= c and b<= c:
    print(a, b, c)
elif a <= b and a <= c and c <=b:
    print(a, c, b)
elif b <= a and b <= c and c <=a:
    print(b, c, a)
elif b <= a and b <= c and a <=c:
    print(b, a, c)
elif c <= a and c <= b and a <=b:
    print(c, a, b)
else:
    print(c, b, a)